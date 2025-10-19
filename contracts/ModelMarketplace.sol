// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "./ModelRegistry.sol";

/**
 * @title ModelMarketplace
 * @dev Handles all commercial aspects: pricing, licenses, variations, royalties
 * ERC-2981 compliant royalty system
 */
contract ModelMarketplace is IERC2981, Ownable {
    // ============ EVENTS ============
    event PriceUpdated(uint256 indexed modelId, uint256 newPrice, uint256 timestamp);
    event LicenseUpdated(uint256 indexed modelId, LicenseConfig newLicense, uint256 timestamp);
    event VariationAdded(uint256 indexed modelId, Variation newVariation, uint256 timestamp);
    event RoyaltyUpdated(uint256 indexed modelId, address recipient, uint256 bps, uint256 timestamp);
    event SupplyUpdated(uint256 indexed modelId, uint256 maxSupply, uint256 timestamp);

    // ============ STRUCTS ============
    struct LicenseConfig {
        uint256 personalPrice;
        uint256 indiePrice;
        uint256 commercialPrice;
        uint256 enterprisePrice;
        uint256 personalDuration;  // 0 = perpetual
        uint256 indieDuration;     // seconds
        uint256 commercialDuration; // seconds
        uint256 enterpriseDuration; // seconds
    }
    
    struct Variation {
        string name;
        uint256 price;
        string metadataIPFS;
        bool active;
    }
    
    struct RoyaltyInfo {
        address recipient;
        uint256 bps; // Basis points (100 = 1%)
    }

    // ============ STORAGE ============
    ModelRegistry public registry;
    
    mapping(uint256 => LicenseConfig) public licenseConfigs;
    mapping(uint256 => RoyaltyInfo) public royalties;
    mapping(uint256 => uint256) public maxSupplies;
    mapping(uint256 => uint256) public soldCounts;
    mapping(uint256 => Variation[]) public variations;
    mapping(uint256 => bool) public forSale;
    
    uint256 public constant MAX_ROYALTY_BPS = 2000; // 20% maximum royalty

    // ============ MODIFIERS ============
    modifier onlyCreator(uint256 modelId) {
        require(registry.models(modelId).creator == msg.sender, "Marketplace: Not model creator");
        _;
    }
    
    modifier modelExists(uint256 modelId) {
        require(registry.models(modelId).exists, "Marketplace: Model does not exist");
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor(address registryAddress) Ownable(msg.sender) {
        registry = ModelRegistry(registryAddress);
    }

    // ============ LICENSE CONFIGURATION ============
    
    /**
     * @dev Configure license prices and durations
     */
    function setLicenseConfig(
        uint256 modelId,
        LicenseConfig memory config
    ) external modelExists(modelId) onlyCreator(modelId) {
        licenseConfigs[modelId] = config;
        emit LicenseUpdated(modelId, config, block.timestamp);
    }
    
    /**
     * @dev Set base price for a specific license type
     */
    function setLicensePrice(
        uint256 modelId,
        string memory licenseType,
        uint256 price
    ) external modelExists(modelId) onlyCreator(modelId) {
        LicenseConfig storage config = licenseConfigs[modelId];
        
        if (keccak256(abi.encodePacked(licenseType)) == keccak256(abi.encodePacked("personal"))) {
            config.personalPrice = price;
        } else if (keccak256(abi.encodePacked(licenseType)) == keccak256(abi.encodePacked("indie"))) {
            config.indiePrice = price;
        } else if (keccak256(abi.encodePacked(licenseType)) == keccak256(abi.encodePacked("commercial"))) {
            config.commercialPrice = price;
        } else if (keccak256(abi.encodePacked(licenseType)) == keccak256(abi.encodePacked("enterprise"))) {
            config.enterprisePrice = price;
        } else {
            revert("Marketplace: Invalid license type");
        }
        
        emit PriceUpdated(modelId, price, block.timestamp);
    }

    // ============ ROYALTY FUNCTIONS ============
    
    /**
     * @dev Set royalty for a model (ERC-2981 compliant)
     */
    function setRoyalty(
        uint256 modelId,
        address recipient,
        uint256 bps
    ) external modelExists(modelId) onlyCreator(modelId) {
        require(bps <= MAX_ROYALTY_BPS, "Marketplace: Royalty too high");
        require(recipient != address(0), "Marketplace: Invalid recipient");
        
        royalties[modelId] = RoyaltyInfo(recipient, bps);
        emit RoyaltyUpdated(modelId, recipient, bps, block.timestamp);
    }
    
    /**
     * @dev ERC-2981 royalty info function
     */
    function royaltyInfo(
        uint256 modelId,
        uint256 salePrice
    ) external view override returns (address receiver, uint256 royaltyAmount) {
        RoyaltyInfo memory royalty = royalties[modelId];
        if (royalty.recipient == address(0)) {
            return (address(0), 0);
        }
        royaltyAmount = (salePrice * royalty.bps) / 10000;
        return (royalty.recipient, royaltyAmount);
    }

    // ============ VARIATION FUNCTIONS ============
    
    /**
     * @dev Add a material variation to a model
     */
    function addVariation(
        uint256 modelId,
        string memory name,
        uint256 price,
        string memory metadataIPFS
    ) external modelExists(modelId) onlyCreator(modelId) {
        variations[modelId].push(Variation({
            name: name,
            price: price,
            metadataIPFS: metadataIPFS,
            active: true
        }));
        
        emit VariationAdded(modelId, variations[modelId][variations[modelId].length - 1], block.timestamp);
    }
    
    /**
     * @dev Toggle variation active status
     */
    function toggleVariationActive(
        uint256 modelId,
        uint256 variationIndex
    ) external modelExists(modelId) onlyCreator(modelId) {
        require(variationIndex < variations[modelId].length, "Marketplace: Invalid variation index");
        variations[modelId][variationIndex].active = !variations[modelId][variationIndex].active;
    }

    // ============ SUPPLY FUNCTIONS ============
    
    /**
     * @dev Set maximum supply (0 = unlimited)
     */
    function setMaxSupply(uint256 modelId, uint256 maxSupply) 
        external 
        modelExists(modelId) 
        onlyCreator(modelId) 
    {
        require(maxSupply == 0 || maxSupply >= soldCounts[modelId], "Marketplace: Supply below sold count");
        maxSupplies[modelId] = maxSupply;
        emit SupplyUpdated(modelId, maxSupply, block.timestamp);
    }
    
    /**
     * @dev Toggle model for sale status
     */
    function toggleForSale(uint256 modelId) 
        external 
        modelExists(modelId) 
        onlyCreator(modelId) 
    {
        forSale[modelId] = !forSale[modelId];
    }
    
    /**
     * @dev Increment sold count (called by token contract)
     */
    function incrementSoldCount(uint256 modelId) external {
        soldCounts[modelId]++;
    }

    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get current price for a license type
     */
    function getLicensePrice(uint256 modelId, string memory licenseType) 
        external 
        view 
        returns (uint256) 
    {
        LicenseConfig memory license = licenseConfigs[modelId];
        
        if (keccak256(abi.encodePacked(licenseType)) == keccak256(abi.encodePacked("personal"))) {
            return license.personalPrice;
        } else if (keccak256(abi.encodePacked(licenseType)) == keccak256(abi.encodePacked("indie"))) {
            return license.indiePrice;
        } else if (keccak256(abi.encodePacked(licenseType)) == keccak256(abi.encodePacked("commercial"))) {
            return license.commercialPrice;
        } else if (keccak256(abi.encodePacked(licenseType)) == keccak256(abi.encodePacked("enterprise"))) {
            return license.enterprisePrice;
        }
        
        revert("Marketplace: Invalid license type");
    }
    
    /**
     * @dev Get license duration for a type
     */
    function getLicenseDuration(uint256 modelId, string memory licenseType) 
        external 
        view 
        returns (uint256) 
    {
        LicenseConfig memory license = licenseConfigs[modelId];
        
        if (keccak256(abi.encodePacked(licenseType)) == keccak256(abi.encodePacked("personal"))) {
            return license.personalDuration;
        } else if (keccak256(abi.encodePacked(licenseType)) == keccak256(abi.encodePacked("indie"))) {
            return license.indieDuration;
        } else if (keccak256(abi.encodePacked(licenseType)) == keccak256(abi.encodePacked("commercial"))) {
            return license.commercialDuration;
        } else if (keccak256(abi.encodePacked(licenseType)) == keccak256(abi.encodePacked("enterprise"))) {
            return license.enterpriseDuration;
        }
        
        revert("Marketplace: Invalid license type");
    }
    
    /**
     * @dev Check if model can be purchased
     */
    function canPurchase(uint256 modelId) external view returns (bool) {
        if (!registry.isModelActive(modelId)) return false;
        if (!forSale[modelId]) return false;
        
        uint256 maxSupply = maxSupplies[modelId];
        if (maxSupply > 0 && soldCounts[modelId] >= maxSupply) return false;
        
        return true;
    }
    
    /**
     * @dev Get all active variations for a model
     */
    function getActiveVariations(uint256 modelId) 
        external 
        view 
        returns (Variation[] memory) 
    {
        Variation[] memory allVariations = variations[modelId];
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < allVariations.length; i++) {
            if (allVariations[i].active) {
                activeCount++;
            }
        }
        
        Variation[] memory activeVariations = new Variation[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < allVariations.length; i++) {
            if (allVariations[i].active) {
                activeVariations[currentIndex] = allVariations[i];
                currentIndex++;
            }
        }
        
        return activeVariations;
    }
    
    /**
     * @dev Get total price including variations
     */
    function getTotalPrice(
        uint256 modelId,
        string memory licenseType,
        uint256[] memory variationIds
    ) external view returns (uint256) {
        uint256 total = this.getLicensePrice(modelId, licenseType);
        
        for (uint256 i = 0; i < variationIds.length; i++) {
            require(variationIds[i] < variations[modelId].length, "Marketplace: Invalid variation ID");
            require(variations[modelId][variationIds[i]].active, "Marketplace: Variation not active");
            total += variations[modelId][variationIds[i]].price;
        }
        
        return total;
    }
}