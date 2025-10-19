// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ModelRegistry
 * @dev Permanent registry for all 3D models - the immutable source of truth
 * Stores core model information that never changes after registration
 */
contract ModelRegistry is Ownable {
    using Counters for Counters.Counter;

    // ============ EVENTS ============
    event ModelRegistered(
        uint256 indexed modelId,
        address indexed creator,
        string modelIPFS,
        string metadataIPFS,
        uint256 timestamp
    );
    
    event ModelUpdated(
        uint256 indexed modelId,
        address indexed updater,
        string newMetadataIPFS,
        uint256 timestamp
    );

    event ModelStatusChanged(
        uint256 indexed modelId,
        bool active,
        uint256 timestamp
    );

    // ============ STRUCTS ============
    struct Model {
        address creator;           // Original creator (immutable)
        uint256 createdAt;         // Registration timestamp (immutable)
        uint256 updatedAt;         // Last metadata update
        string modelIPFS;          // Core 3D file location (IPFS hash)
        string metadataIPFS;       // Current metadata (can update)
        bool exists;               // Model exists flag
        bool active;               // Model is active for sale
        uint256 derivativeCount;   // Number of derivatives created from this model
    }

    // ============ STORAGE ============
    Counters.Counter private _modelIdCounter;
    
    mapping(uint256 => Model) public models;
    mapping(address => uint256[]) public creatorModels;
    mapping(uint256 => uint256[]) public modelDerivatives; // originalModelId -> derivativeModelIds
    
    address public marketplace;
    address public derivativeRoyaltyRegistry;

    // ============ MODIFIERS ============
    modifier onlyCreator(uint256 modelId) {
        require(models[modelId].creator == msg.sender, "ModelRegistry: Not model creator");
        _;
    }
    
    modifier modelExists(uint256 modelId) {
        require(models[modelId].exists, "ModelRegistry: Model does not exist");
        _;
    }

    modifier onlyMarketplace() {
        require(msg.sender == marketplace, "ModelRegistry: Only marketplace can call");
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor() Ownable(msg.sender) {}

    // ============ CORE FUNCTIONS ============
    
    /**
     * @dev Register a new 3D model
     * @param modelIPFS IPFS hash of the main 3D file
     * @param metadataIPFS IPFS hash of model metadata
     * @return modelId The permanent ID assigned to this model
     */
    function registerModel(
        string memory modelIPFS,
        string memory metadataIPFS
    ) external returns (uint256 modelId) {
        require(bytes(modelIPFS).length > 0, "ModelRegistry: Model IPFS required");
        require(bytes(metadataIPFS).length > 0, "ModelRegistry: Metadata IPFS required");
        
        modelId = _modelIdCounter.current();
        _modelIdCounter.increment();
        
        models[modelId] = Model({
            creator: msg.sender,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            modelIPFS: modelIPFS,
            metadataIPFS: metadataIPFS,
            exists: true,
            active: true,
            derivativeCount: 0
        });
        
        creatorModels[msg.sender].push(modelId);
        
        emit ModelRegistered(modelId, msg.sender, modelIPFS, metadataIPFS, block.timestamp);
    }

    /**
     * @dev Register a derivative model and link to original
     */
    function registerDerivativeModel(
        string memory modelIPFS,
        string memory metadataIPFS,
        uint256 originalModelId
    ) external modelExists(originalModelId) returns (uint256 modelId) {
        modelId = registerModel(modelIPFS, metadataIPFS);
        
        // Link derivative to original
        modelDerivatives[originalModelId].push(modelId);
        models[originalModelId].derivativeCount++;
    }

    /**
     * @dev Update model metadata (description, tags, etc.)
     */
    function updateMetadata(
        uint256 modelId,
        string memory newMetadataIPFS
    ) external modelExists(modelId) onlyCreator(modelId) {
        require(bytes(newMetadataIPFS).length > 0, "ModelRegistry: Metadata IPFS required");
        
        models[modelId].metadataIPFS = newMetadataIPFS;
        models[modelId].updatedAt = block.timestamp;
        
        emit ModelUpdated(modelId, msg.sender, newMetadataIPFS, block.timestamp);
    }

    /**
     * @dev Toggle model active status (enable/disable sales)
     */
    function toggleModelActive(uint256 modelId) 
        external 
        modelExists(modelId) 
        onlyCreator(modelId) 
    {
        models[modelId].active = !models[modelId].active;
        emit ModelStatusChanged(modelId, models[modelId].active, block.timestamp);
    }

    // ============ MARKETPLACE FUNCTIONS ============
    
    /**
     * @dev Marketplace can increment derivative count (called when derivative is registered in royalty registry)
     */
    function incrementDerivativeCount(uint256 modelId) 
        external 
        modelExists(modelId) 
        onlyMarketplace 
    {
        models[modelId].derivativeCount++;
    }

    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get all models created by an address
     */
    function getCreatorModels(address creator) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return creatorModels[creator];
    }
    
    /**
     * @dev Check if model exists and is active
     */
    function isModelActive(uint256 modelId) external view returns (bool) {
        return models[modelId].exists && models[modelId].active;
    }
    
    /**
     * @dev Get total model count
     */
    function getModelCount() external view returns (uint256) {
        return _modelIdCounter.current();
    }

    /**
     * @dev Get derivatives of a model
     */
    function getDerivatives(uint256 modelId) 
        external 
        view 
        modelExists(modelId) 
        returns (uint256[] memory) 
    {
        return modelDerivatives[modelId];
    }

    // ============ ADMIN FUNCTIONS ============
    
    function setMarketplace(address _marketplace) external onlyOwner {
        marketplace = _marketplace;
    }
    
    function setDerivativeRoyaltyRegistry(address _registry) external onlyOwner {
        derivativeRoyaltyRegistry = _registry;
    }
}