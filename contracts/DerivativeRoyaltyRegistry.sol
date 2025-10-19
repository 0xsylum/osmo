// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./ModelRegistry.sol";

/**
 * @title DerivativeRoyaltyRegistry
 * @dev Handles two distinct royalty systems:
 * 1. Automatic royalties for derivative works
 * 2. Direct royalty payments (tip jar system)
 */
contract DerivativeRoyaltyRegistry is Ownable {
    using Counters for Counters.Counter;

    // ============ EVENTS ============
    event DerivativeRoyaltySet(
        uint256 indexed derivativeModelId,
        uint256 indexed originalModelId,
        address indexed originalCreator,
        uint256 royaltyBps,
        uint256 timestamp
    );
    
    event DerivativeRoyaltyPaid(
        uint256 indexed derivativeModelId,
        uint256 indexed originalModelId,
        address indexed originalCreator,
        uint256 amount,
        uint256 salePrice,
        uint256 timestamp
    );
    
    event DirectRoyaltyPaid(
        address indexed from,
        address indexed to,
        uint256 amount,
        string message,
        uint256 timestamp
    );
    
    event RoyaltiesClaimed(
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    // ============ STRUCTS ============
    struct DerivativeRoyalty {
        uint256 originalModelId;
        address originalCreator;
        uint256 royaltyBps;
        bool active;
    }
    
    struct RoyaltyPayment {
        address from;
        address to;
        uint256 amount;
        uint256 modelId;
        string paymentType; // "derivative" or "direct"
        string message;
        uint256 timestamp;
    }

    // ============ STORAGE ============
    Counters.Counter private _paymentIdCounter;
    
    ModelRegistry public registry;
    
    mapping(uint256 => DerivativeRoyalty) public derivativeRoyalties;
    mapping(address => uint256) public claimableRoyalties;
    mapping(uint256 => RoyaltyPayment) public royaltyPayments;
    mapping(address => uint256[]) public creatorPayments;

    uint256 public constant MAX_DERIVATIVE_ROYALTY_BPS = 2000; // 20% maximum

    // ============ MODIFIERS ============
    modifier modelExists(uint256 modelId) {
        require(registry.models(modelId).exists, "DerivativeRoyalty: Model does not exist");
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor(address registryAddress) Ownable(msg.sender) {
        registry = ModelRegistry(registryAddress);
    }

    // ============ DERIVATIVE ROYALTY FUNCTIONS ============

    /**
     * @dev Set up royalty for a derivative work
     */
    function setDerivativeRoyalty(
        uint256 derivativeModelId,
        uint256 originalModelId,
        uint256 royaltyBps
    ) external modelExists(derivativeModelId) modelExists(originalModelId) {
        require(royaltyBps <= MAX_DERIVATIVE_ROYALTY_BPS, "DerivativeRoyalty: Royalty too high");
        
        ModelRegistry.Model memory originalModel = registry.models(originalModelId);
        require(originalModel.creator != address(0), "DerivativeRoyalty: Invalid original creator");
        
        derivativeRoyalties[derivativeModelId] = DerivativeRoyalty({
            originalModelId: originalModelId,
            originalCreator: originalModel.creator,
            royaltyBps: royaltyBps,
            active: true
        });
        
        // Notify registry about derivative
        registry.incrementDerivativeCount(originalModelId);
        
        emit DerivativeRoyaltySet(
            derivativeModelId,
            originalModelId,
            originalModel.creator,
            royaltyBps,
            block.timestamp
        );
    }

    /**
     * @dev Pay royalties when selling a derivative work
     */
    function payDerivativeRoyalty(
        uint256 derivativeModelId,
        uint256 salePrice
    ) external payable modelExists(derivativeModelId) {
        DerivativeRoyalty memory royalty = derivativeRoyalties[derivativeModelId];
        require(royalty.active, "DerivativeRoyalty: No derivative royalty set");
        require(msg.value == salePrice, "DerivativeRoyalty: Incorrect payment amount");
        
        uint256 royaltyAmount = (salePrice * royalty.royaltyBps) / 10000;
        uint256 remainingAmount = salePrice - royaltyAmount;
        
        // Pay royalty to original creator
        claimableRoyalties[royalty.originalCreator] += royaltyAmount;
        
        // Send remaining to current seller (msg.sender)
        payable(msg.sender).transfer(remainingAmount);
        
        // Record payment
        uint256 paymentId = _paymentIdCounter.current();
        _paymentIdCounter.increment();
        
        royaltyPayments[paymentId] = RoyaltyPayment({
            from: msg.sender,
            to: royalty.originalCreator,
            amount: royaltyAmount,
            modelId: derivativeModelId,
            paymentType: "derivative",
            message: "",
            timestamp: block.timestamp
        });
        
        creatorPayments[royalty.originalCreator].push(paymentId);
        
        emit DerivativeRoyaltyPaid(
            derivativeModelId,
            royalty.originalModelId,
            royalty.originalCreator,
            royaltyAmount,
            salePrice,
            block.timestamp
        );
    }

    // ============ DIRECT ROYALTY PAYMENT FUNCTIONS ============

    /**
     * @dev Direct royalty payment to a creator (tip/jar system)
     */
    function payDirectRoyalty(
        address creator,
        string memory message
    ) external payable {
        require(creator != address(0), "DerivativeRoyalty: Invalid creator address");
        require(msg.value > 0, "DerivativeRoyalty: Payment required");
        require(creator != msg.sender, "DerivativeRoyalty: Cannot pay yourself");
        
        claimableRoyalties[creator] += msg.value;
        
        uint256 paymentId = _paymentIdCounter.current();
        _paymentIdCounter.increment();
        
        royaltyPayments[paymentId] = RoyaltyPayment({
            from: msg.sender,
            to: creator,
            amount: msg.value,
            modelId: 0, // No specific model for direct payments
            paymentType: "direct",
            message: message,
            timestamp: block.timestamp
        });
        
        creatorPayments[creator].push(paymentId);
        
        emit DirectRoyaltyPaid(msg.sender, creator, msg.value, message, block.timestamp);
    }

    /**
     * @dev Creators claim their accumulated royalties
     */
    function claimRoyalties() external {
        uint256 amount = claimableRoyalties[msg.sender];
        require(amount > 0, "DerivativeRoyalty: No royalties to claim");
        
        claimableRoyalties[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        
        emit RoyaltiesClaimed(msg.sender, amount, block.timestamp);
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Get derivative royalty info for a model
     */
    function getDerivativeRoyalty(uint256 derivativeModelId) 
        external 
        view 
        returns (DerivativeRoyalty memory) 
    {
        return derivativeRoyalties[derivativeModelId];
    }
    
    /**
     * @dev Check claimable royalties for an address
     */
    function getClaimableRoyalties(address creator) 
        external 
        view 
        returns (uint256) 
    {
        return claimableRoyalties[creator];
    }
    
    /**
     * @dev Get royalty payment history for a creator
     */
    function getRoyaltyHistory(address creator) 
        external 
        view 
        returns (RoyaltyPayment[] memory) 
    {
        uint256[] memory paymentIds = creatorPayments[creator];
        RoyaltyPayment[] memory history = new RoyaltyPayment[](paymentIds.length);
        
        for (uint256 i = 0; i < paymentIds.length; i++) {
            history[i] = royaltyPayments[paymentIds[i]];
        }
        
        return history;
    }
    
    /**
     * @dev Get total royalties earned by a creator
     */
    function getTotalRoyaltiesEarned(address creator) 
        external 
        view 
        returns (uint256) 
    {
        uint256[] memory paymentIds = creatorPayments[creator];
        uint256 total = 0;
        
        for (uint256 i = 0; i < paymentIds.length; i++) {
            total += royaltyPayments[paymentIds[i]].amount;
        }
        
        return total;
    }

    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Emergency function to deactivate a derivative royalty
     */
    function deactivateDerivativeRoyalty(uint256 derivativeModelId) external onlyOwner {
        derivativeRoyalties[derivativeModelId].active = false;
    }
}