// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IYieldAggregator
 * @notice Interface for Meridian Yield Aggregator
 * @dev Aggregates yield from multiple vaults and protocols
 */
interface IYieldAggregator {
    // ============================================
    // EVENTS
    // ============================================
    
    event StrategyAdded(address indexed vault, uint256 allocation, string name);
    event StrategyRemoved(address indexed vault);
    event StrategyUpdated(address indexed vault, uint256 newAllocation);
    event Rebalanced(uint256 timestamp, uint256 totalValue);
    event YieldClaimed(address indexed vault, uint256 amount);
    event DepositToStrategy(address indexed vault, uint256 amount);
    event WithdrawFromStrategy(address indexed vault, uint256 amount);
    event EmergencyExit(address indexed vault, uint256 amount);
    event PerformanceFeeUpdated(uint256 oldFee, uint256 newFee);

    // ============================================
    // ERRORS
    // ============================================
    
    error StrategyNotFound(address vault);
    error StrategyAlreadyExists(address vault);
    error InvalidAllocation();
    error AllocationExceeds100Percent();
    error InsufficientBalance();
    error RebalanceTooFrequent();
    error SlippageExceeded(uint256 expected, uint256 received);
    error StrategyPaused(address vault);
    error MaxStrategiesReached();
    error ZeroAddress();
    error ZeroAmount();

    // ============================================
    // STRUCTS
    // ============================================
    
    struct Strategy {
        address vault;
        string name;
        uint256 allocation; // basis points (10000 = 100%)
        uint256 deposited;
        uint256 lastHarvest;
        uint256 totalYieldEarned;
        bool active;
        uint8 riskScore; // 1-100
    }

    struct AggregatorConfig {
        uint256 performanceFee; // basis points
        uint256 rebalanceThreshold; // basis points deviation to trigger rebalance
        uint256 minRebalanceInterval; // minimum seconds between rebalances
        uint256 maxStrategies;
        address feeRecipient;
        bool autoCompound;
    }

    struct PortfolioMetrics {
        uint256 totalValue;
        uint256 totalDeposited;
        uint256 totalYield;
        uint256 weightedAPY;
        uint256 weightedRisk;
        uint256 lastRebalance;
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    /// @notice Returns all active strategies
    function getStrategies() external view returns (Strategy[] memory);
    
    /// @notice Returns a specific strategy
    function getStrategy(address vault) external view returns (Strategy memory);
    
    /// @notice Returns current portfolio metrics
    function getPortfolioMetrics() external view returns (PortfolioMetrics memory);
    
    /// @notice Returns the aggregator configuration
    function getConfig() external view returns (AggregatorConfig memory);
    
    /// @notice Calculate optimal allocation based on risk/reward
    function calculateOptimalAllocation() external view returns (address[] memory vaults, uint256[] memory allocations);
    
    /// @notice Check if rebalance is needed
    function needsRebalance() external view returns (bool);
    
    /// @notice Get total value locked across all strategies
    function totalValueLocked() external view returns (uint256);
    
    /// @notice Get pending yield to be harvested
    function pendingYield() external view returns (uint256);

    // ============================================
    // MUTATIVE FUNCTIONS
    // ============================================
    
    /// @notice Deposit assets to be allocated across strategies
    /// @param amount Amount of base asset to deposit
    function deposit(uint256 amount) external;
    
    /// @notice Withdraw assets from strategies
    /// @param amount Amount of base asset to withdraw
    function withdraw(uint256 amount) external;
    
    /// @notice Add a new yield strategy
    /// @param vault Address of the vault
    /// @param allocation Target allocation in basis points
    /// @param name Human-readable name
    /// @param riskScore Risk score 1-100
    function addStrategy(
        address vault,
        uint256 allocation,
        string calldata name,
        uint8 riskScore
    ) external;
    
    /// @notice Remove a strategy
    /// @param vault Address of the vault to remove
    function removeStrategy(address vault) external;
    
    /// @notice Update strategy allocation
    /// @param vault Address of the vault
    /// @param newAllocation New allocation in basis points
    function updateAllocation(address vault, uint256 newAllocation) external;
    
    /// @notice Rebalance portfolio to match target allocations
    function rebalance() external;
    
    /// @notice Harvest yield from all strategies
    function harvestAll() external;
    
    /// @notice Harvest yield from specific strategy
    /// @param vault Address of the vault
    function harvest(address vault) external;
    
    /// @notice Emergency exit from a strategy
    /// @param vault Address of the vault
    function emergencyExit(address vault) external;
}
