// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./ModelRegistry.sol";
import "./ModelMarketplace.sol";

/**
 * @title ModelToken
 * @dev ERC721 tokens representing purchased model licenses
 * Each token is a frozen snapshot of purchase conditions
 */
contract ModelToken is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    // ============ EVENTS ============
    event ModelPurchased(
        uint256 indexed tokenId,
        uint256 indexed modelId,
        address indexed purchaser,
        uint256 pricePaid,
        string licenseType,
        uint256[] variationIds,
        uint256 timestamp
    );
    
    event TokenBurned(
        uint256 indexed tokenId,
        address indexed formerOwner,
        string downloadKey,
        uint256 timestamp
    );

    event LicenseRenewed(
        uint256 indexed tokenId,
        uint256 newExpiry,
        uint256 renewalPrice,
        uint256 timestamp
    );

    // ============ STRUCTS ============
    struct LicenseSnapshot {
        string licenseType;
        uint256 purchasedAt;
        uint256 expiresAt; // 0 = perpetual
        uint256 duration;
    }
    
    struct PurchaseSnapshot {
        uint256 modelId;
        uint256 purchasedAt;
        uint256 pricePaid;
        LicenseSnapshot license;
        uint256[] variationIds;
        string metadataSnapshot;
        uint256 royaltyBpsAtPurchase;
        bool burned;
        string downloadKey;
    }

    // ============ STORAGE ============
    Counters.Counter private _tokenIdCounter;
    
    ModelRegistry public registry;
    ModelMarketplace public marketplace;
    
    mapping(uint256 => PurchaseSnapshot) public purchaseSnapshots;
    mapping(uint256 => uint256) public modelPurchaseCount;
    mapping(address => uint256[]) public userTokens;

    string public constant BASE_URI = "https://ipfs.io/ipfs/";

    // ============ MODIFIERS ============
    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "ModelToken: Not token owner");
        _;
    }

    modifier tokenExists(uint256 tokenId) {
        require(_exists(tokenId), "ModelToken: Token does not exist");
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor(address registryAddress, address marketplaceAddress) 
        ERC721("3DModelLicense", "3DML") 
        Ownable(msg.sender)
    {
        registry = ModelRegistry(registryAddress);
        marketplace = ModelMarketplace(marketplaceAddress);
    }

    // ============ PURCHASE FUNCTIONS ============
    
    /**
     * @dev Purchase a model with specific license and variations
     */
    function purchaseModel(
        uint256 modelId,
        string memory licenseType,
        uint256[] memory variationIds
    ) external payable tokenExists(modelId) {
        // Verify model can be purchased
        require(marketplace.canPurchase(modelId), "ModelToken: Model not available");
        
        // Calculate total price
        uint256 totalPrice = marketplace.getTotalPrice(modelId, licenseType, variationIds);
        require(msg.value >= totalPrice, "ModelToken: Insufficient payment");
        
        // Get current model state for snapshot
        ModelRegistry.Model memory model = registry.models(modelId);
        (address royaltyRecipient, uint256 royaltyBps) = marketplace.royaltyInfo(modelId, totalPrice);
        
        // Calculate license expiration
        uint256 duration = marketplace.getLicenseDuration(modelId, licenseType);
        uint256 expiresAt = duration > 0 ? block.timestamp + duration : 0;
        
        // Create token
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        purchaseSnapshots[tokenId] = PurchaseSnapshot({
            modelId: modelId,
            purchasedAt: block.timestamp,
            pricePaid: totalPrice,
            license: LicenseSnapshot({
                licenseType: licenseType,
                purchasedAt: block.timestamp,
                expiresAt: expiresAt,
                duration: duration
            }),
            variationIds: variationIds,
            metadataSnapshot: model.metadataIPFS,
            royaltyBpsAtPurchase: royaltyBps,
            burned: false,
            downloadKey: ""
        });
        
        // Mint NFT to purchaser
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, model.metadataIPFS);
        userTokens[msg.sender].push(tokenId);
        
        // Update counters
        modelPurchaseCount[modelId]++;
        marketplace.incrementSoldCount(modelId);
        
        // Distribute payment
        _distributePayment(model.creator, totalPrice, royaltyRecipient, royaltyBps);
        
        emit ModelPurchased(
            tokenId,
            modelId,
            msg.sender,
            totalPrice,
            licenseType,
            variationIds,
            block.timestamp
        );
    }

    // ============ BURN & DOWNLOAD FUNCTIONS ============
    
    /**
     * @dev Burn token to get download access
     */
    function burnForDownload(uint256 tokenId) 
        external 
        tokenExists(tokenId) 
        onlyTokenOwner(tokenId) 
    {
        PurchaseSnapshot storage snapshot = purchaseSnapshots[tokenId];
        require(!snapshot.burned, "ModelToken: Already burned");
        require(isLicenseValid(tokenId), "ModelToken: License expired");
        
        // Generate download key
        string memory downloadKey = _generateDownloadKey(tokenId);
        
        // Update token state
        snapshot.burned = true;
        snapshot.downloadKey = downloadKey;
        
        // Burn the NFT
        _burn(tokenId);
        
        emit TokenBurned(tokenId, msg.sender, downloadKey, block.timestamp);
    }
    
    /**
     * @dev Admin function to set download key (for secure key management)
     */
    function setDownloadKey(uint256 tokenId, string memory downloadKey) 
        external 
        onlyOwner 
    {
        require(purchaseSnapshots[tokenId].burned, "ModelToken: Token not burned");
        purchaseSnapshots[tokenId].downloadKey = downloadKey;
    }

    // ============ LICENSE MANAGEMENT ============
    
    /**
     * @dev Renew an expiring license
     */
    function renewLicense(uint256 tokenId) external payable tokenExists(tokenId) onlyTokenOwner(tokenId) {
        PurchaseSnapshot storage snapshot = purchaseSnapshots[tokenId];
        require(snapshot.license.expiresAt > 0, "ModelToken: Cannot renew perpetual license");
        require(!snapshot.burned, "ModelToken: Token burned");
        
        uint256 modelId = snapshot.modelId;
        uint256 renewalPrice = marketplace.getLicensePrice(modelId, snapshot.license.licenseType);
        require(msg.value >= renewalPrice, "ModelToken: Insufficient renewal payment");
        
        // Extend license
        uint256 newExpiry = snapshot.license.expiresAt + snapshot.license.duration;
        snapshot.license.expiresAt = newExpiry;
        
        // Pay royalty to creator
        ModelRegistry.Model memory model = registry.models(modelId);
        uint256 royaltyAmount = (renewalPrice * snapshot.royaltyBpsAtPurchase) / 10000;
        uint256 creatorAmount = renewalPrice - royaltyAmount;
        
        payable(model.creator).transfer(creatorAmount);
        if (royaltyAmount > 0) {
            (address royaltyRecipient, ) = marketplace.royaltyInfo(modelId, renewalPrice);
            if (royaltyRecipient != address(0)) {
                payable(royaltyRecipient).transfer(royaltyAmount);
            }
        }
        
        emit LicenseRenewed(tokenId, newExpiry, renewalPrice, block.timestamp);
    }

    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Check if a token's license is still valid
     */
    function isLicenseValid(uint256 tokenId) public view returns (bool) {
        PurchaseSnapshot memory snapshot = purchaseSnapshots[tokenId];
        if (snapshot.license.expiresAt == 0) return true; // Perpetual
        return block.timestamp <= snapshot.license.expiresAt;
    }
    
    /**
     * @dev Get all tokens owned by an address
     */
    function getOwnedTokens(address owner) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userTokens[owner];
    }
    
    /**
     * @dev Check if a token is valid for download
     */
    function canDownload(uint256 tokenId) external view returns (bool) {
        return purchaseSnapshots[tokenId].burned && 
               bytes(purchaseSnapshots[tokenId].downloadKey).length > 0;
    }
    
    /**
     * @dev Get burn certificate for provenance
     */
    function getBurnCertificate(uint256 tokenId) 
        external 
        view 
        returns (PurchaseSnapshot memory) 
    {
        require(purchaseSnapshots[tokenId].burned, "ModelToken: Token not burned");
        return purchaseSnapshots[tokenId];
    }
    
    /**
     * @dev Get remaining license time
     */
    function getLicenseTimeRemaining(uint256 tokenId) 
        external 
        view 
        returns (uint256) 
    {
        PurchaseSnapshot memory snapshot = purchaseSnapshots[tokenId];
        if (snapshot.license.expiresAt == 0) return type(uint256).max;
        if (block.timestamp >= snapshot.license.expiresAt) return 0;
        return snapshot.license.expiresAt - block.timestamp;
    }

    // ============ INTERNAL FUNCTIONS ============
    
    function _distributePayment(
        address creator,
        uint256 totalPrice,
        address royaltyRecipient,
        uint256 royaltyBps
    ) internal {
        uint256 royaltyAmount = (totalPrice * royaltyBps) / 10000;
        uint256 creatorAmount = totalPrice - royaltyAmount;
        
        // Pay creator
        payable(creator).transfer(creatorAmount);
        
        // Pay royalty if applicable
        if (royaltyAmount > 0 && royaltyRecipient != address(0)) {
            payable(royaltyRecipient).transfer(royaltyAmount);
        }
    }
    
    function _generateDownloadKey(uint256 tokenId) 
        internal 
        view 
        returns (string memory) 
    {
        return string(abi.encodePacked(
            "key_",
            _toString(tokenId),
            "_",
            _toString(block.timestamp),
            "_",
            _toString(uint256(keccak256(abi.encodePacked(tokenId, block.timestamp, msg.sender))))
        ));
    }
    
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        
        // If token is being transferred, update userTokens mapping
        if (from != address(0) && to != address(0)) {
            // Remove from sender's list
            uint256[] storage fromTokens = userTokens[from];
            for (uint256 i = 0; i < fromTokens.length; i++) {
                if (fromTokens[i] == tokenId) {
                    fromTokens[i] = fromTokens[fromTokens.length - 1];
                    fromTokens.pop();
                    break;
                }
            }
            
            // Add to recipient's list
            userTokens[to].push(tokenId);
        }
        
        return super._update(to, tokenId, auth);
    }
}