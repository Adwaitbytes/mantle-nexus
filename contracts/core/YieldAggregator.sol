// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import {IYieldAggregator} from "../interfaces/IYieldAggregator.sol";
import {MeridianMath} from "../libraries/MeridianMath.sol";

/**
 * @title YieldAggregator
 * @notice Aggregates yield across multiple Meridian vaults
 * @dev Implements smart rebalancing and yield optimization
 * 
 * Features:
 * - Multi-vault yield aggregation
 * - Risk-adjusted allocation
 * - Auto-compounding
 * - Smart rebalancing
 * - Performance fee on yield
 */
contract YieldAggregator is IYieldAggregator, ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;
    using MeridianMath for uint256;

    // ============================================
    // STATE VARIABLES
    // ============================================
    
    /// @notice The base asset for the aggregator
    IERC20 public immutable baseAsset;
    
    /// @notice Aggregator configuration
    AggregatorConfig private _config;
    
    /// @notice Array of strategy addresses
    address[] private _strategyAddresses;
    
    /// @notice Mapping of vault address to strategy
    mapping(address => Strategy) private _strategies;
    
    /// @notice Total deposited by users
    uint256 private _totalDeposited;
    
    /// @notice Total yield earned
    uint256 private _totalYieldEarned;
    
    /// @notice Last rebalance timestamp
    uint256 private _lastRebalance;
    
    /// @notice User deposits
    mapping(address => uint256) public userDeposits;
    
    /// @notice Total user shares
    uint256 public totalShares;
    
    /// @notice User shares
    mapping(address => uint256) public userShares;

    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    constructor(
        address _baseAsset,
        AggregatorConfig memory config_
    ) Ownable(msg.sender) {
        if (_baseAsset == address(0)) revert ZeroAddress();
        if (config_.feeRecipient == address(0)) revert ZeroAddress();
        
        baseAsset = IERC20(_baseAsset);
        _config = config_;
        _lastRebalance = block.timestamp;
    }

    // ============================================
    // DEPOSIT / WITHDRAW
    // ============================================
    
    /**
     * @notice Deposit assets to be allocated across strategies
     */
    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        
        // Calculate shares to mint
        uint256 shares;
        if (totalShares == 0) {
            shares = amount;
        } else {
            shares = (amount * totalShares) / totalValueLocked();
        }
        
        // Transfer assets from user
        baseAsset.safeTransferFrom(msg.sender, address(this), amount);
        
        // Mint shares
        userShares[msg.sender] += shares;
        totalShares += shares;
        
        _totalDeposited += amount;
        userDeposits[msg.sender] += amount;
        
        // Allocate to strategies
        _allocateToStrategies(amount);
    }

    /**
     * @notice Withdraw assets from strategies
     */
    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        
        uint256 userValue = (userShares[msg.sender] * totalValueLocked()) / totalShares;
        if (amount > userValue) {
            revert InsufficientBalance();
        }
        
        // Calculate shares to burn
        uint256 sharesToBurn = (amount * totalShares) / totalValueLocked();
        
        // Withdraw from strategies proportionally
        _withdrawFromStrategies(amount);
        
        // Burn shares
        userShares[msg.sender] -= sharesToBurn;
        totalShares -= sharesToBurn;
        
        // Transfer to user
        baseAsset.safeTransfer(msg.sender, amount);
    }

    // ============================================
    // STRATEGY MANAGEMENT
    // ============================================
    
    /**
     * @notice Add a new yield strategy
     */
    function addStrategy(
        address vault,
        uint256 allocation,
        string calldata name,
        uint8 riskScore
    ) external onlyOwner {
        if (vault == address(0)) revert ZeroAddress();
        if (_strategies[vault].vault != address(0)) revert StrategyAlreadyExists(vault);
        if (_strategyAddresses.length >= _config.maxStrategies) revert MaxStrategiesReached();
        if (riskScore > 100) revert InvalidAllocation();
        
        // Check total allocation doesn't exceed 100%
        uint256 totalAllocation = allocation;
        for (uint256 i = 0; i < _strategyAddresses.length;) {
            totalAllocation += _strategies[_strategyAddresses[i]].allocation;
            unchecked { ++i; }
        }
        if (totalAllocation > MeridianMath.BPS) revert AllocationExceeds100Percent();
        
        _strategies[vault] = Strategy({
            vault: vault,
            name: name,
            allocation: allocation,
            deposited: 0,
            lastHarvest: block.timestamp,
            totalYieldEarned: 0,
            active: true,
            riskScore: riskScore
        });
        
        _strategyAddresses.push(vault);
        
        // Approve vault to spend base asset
        baseAsset.approve(vault, type(uint256).max);
        
        emit StrategyAdded(vault, allocation, name);
    }

    /**
     * @notice Remove a strategy
     */
    function removeStrategy(address vault) external onlyOwner {
        Strategy storage strategy = _strategies[vault];
        if (strategy.vault == address(0)) revert StrategyNotFound(vault);
        
        // Withdraw all from strategy
        if (strategy.deposited > 0) {
            _withdrawFromStrategy(vault, strategy.deposited);
        }
        
        // Remove from array
        for (uint256 i = 0; i < _strategyAddresses.length;) {
            if (_strategyAddresses[i] == vault) {
                _strategyAddresses[i] = _strategyAddresses[_strategyAddresses.length - 1];
                _strategyAddresses.pop();
                break;
            }
            unchecked { ++i; }
        }
        
        // Revoke approval
        baseAsset.approve(vault, 0);
        
        delete _strategies[vault];
        
        emit StrategyRemoved(vault);
    }

    /**
     * @notice Update strategy allocation
     */
    function updateAllocation(address vault, uint256 newAllocation) external onlyOwner {
        Strategy storage strategy = _strategies[vault];
        if (strategy.vault == address(0)) revert StrategyNotFound(vault);
        
        // Check total allocation doesn't exceed 100%
        uint256 totalAllocation = newAllocation;
        for (uint256 i = 0; i < _strategyAddresses.length;) {
            if (_strategyAddresses[i] != vault) {
                totalAllocation += _strategies[_strategyAddresses[i]].allocation;
            }
            unchecked { ++i; }
        }
        if (totalAllocation > MeridianMath.BPS) revert AllocationExceeds100Percent();
        
        strategy.allocation = newAllocation;
        
        emit StrategyUpdated(vault, newAllocation);
    }

    // ============================================
    // REBALANCING
    // ============================================
    
    /**
     * @notice Rebalance portfolio to match target allocations
     */
    function rebalance() external nonReentrant whenNotPaused {
        // Check rebalance interval
        if (block.timestamp < _lastRebalance + _config.minRebalanceInterval) {
            revert RebalanceTooFrequent();
        }
        
        uint256 tvl = totalValueLocked();
        if (tvl == 0) return;
        
        // Calculate target amounts for each strategy
        for (uint256 i = 0; i < _strategyAddresses.length;) {
            address vault = _strategyAddresses[i];
            Strategy storage strategy = _strategies[vault];
            
            if (!strategy.active) {
                unchecked { ++i; }
                continue;
            }
            
            uint256 targetAmount = tvl.bpsOf(strategy.allocation);
            uint256 currentAmount = _getStrategyValue(vault);
            
            if (currentAmount > targetAmount) {
                // Withdraw excess
                uint256 excess = currentAmount - targetAmount;
                _withdrawFromStrategy(vault, excess);
            } else if (currentAmount < targetAmount) {
                // Deposit more
                uint256 deficit = targetAmount - currentAmount;
                uint256 available = baseAsset.balanceOf(address(this));
                if (available >= deficit) {
                    _depositToStrategy(vault, deficit);
                }
            }
            
            unchecked { ++i; }
        }
        
        _lastRebalance = block.timestamp;
        emit Rebalanced(block.timestamp, tvl);
    }

    /**
     * @notice Check if rebalance is needed
     */
    function needsRebalance() external view returns (bool) {
        uint256 tvl = totalValueLocked();
        if (tvl == 0) return false;
        
        for (uint256 i = 0; i < _strategyAddresses.length;) {
            address vault = _strategyAddresses[i];
            Strategy storage strategy = _strategies[vault];
            
            if (!strategy.active) {
                unchecked { ++i; }
                continue;
            }
            
            uint256 targetAmount = tvl.bpsOf(strategy.allocation);
            uint256 currentAmount = _getStrategyValue(vault);
            
            // Check if deviation exceeds threshold
            uint256 deviation;
            if (currentAmount > targetAmount) {
                deviation = ((currentAmount - targetAmount) * MeridianMath.BPS) / targetAmount;
            } else if (targetAmount > 0) {
                deviation = ((targetAmount - currentAmount) * MeridianMath.BPS) / targetAmount;
            }
            
            if (deviation > _config.rebalanceThreshold) {
                return true;
            }
            
            unchecked { ++i; }
        }
        
        return false;
    }

    // ============================================
    // YIELD HARVESTING
    // ============================================
    
    /**
     * @notice Harvest yield from all strategies
     */
    function harvestAll() external nonReentrant {
        for (uint256 i = 0; i < _strategyAddresses.length;) {
            address vault = _strategyAddresses[i];
            if (_strategies[vault].active) {
                _harvestFromStrategy(vault);
            }
            unchecked { ++i; }
        }
    }

    /**
     * @notice Harvest yield from specific strategy
     */
    function harvest(address vault) external nonReentrant {
        if (_strategies[vault].vault == address(0)) revert StrategyNotFound(vault);
        _harvestFromStrategy(vault);
    }

    /**
     * @notice Emergency exit from a strategy
     */
    function emergencyExit(address vault) external onlyOwner {
        Strategy storage strategy = _strategies[vault];
        if (strategy.vault == address(0)) revert StrategyNotFound(vault);
        
        // Get all assets from strategy
        uint256 shares = IERC4626(vault).balanceOf(address(this));
        if (shares > 0) {
            uint256 assets = IERC4626(vault).redeem(shares, address(this), address(this));
            strategy.deposited = 0;
            emit EmergencyExit(vault, assets);
        }
        
        strategy.active = false;
    }

    // ============================================
    // INTERNAL FUNCTIONS
    // ============================================
    
    function _allocateToStrategies(uint256 amount) internal {
        for (uint256 i = 0; i < _strategyAddresses.length;) {
            address vault = _strategyAddresses[i];
            Strategy storage strategy = _strategies[vault];
            
            if (!strategy.active) {
                unchecked { ++i; }
                continue;
            }
            
            uint256 allocation = amount.bpsOf(strategy.allocation);
            if (allocation > 0) {
                _depositToStrategy(vault, allocation);
            }
            
            unchecked { ++i; }
        }
    }

    function _withdrawFromStrategies(uint256 amount) internal {
        uint256 remaining = amount;
        
        for (uint256 i = 0; i < _strategyAddresses.length && remaining > 0;) {
            address vault = _strategyAddresses[i];
            Strategy storage strategy = _strategies[vault];
            
            if (!strategy.active || strategy.deposited == 0) {
                unchecked { ++i; }
                continue;
            }
            
            uint256 toWithdraw = remaining.min(strategy.deposited);
            _withdrawFromStrategy(vault, toWithdraw);
            remaining -= toWithdraw;
            
            unchecked { ++i; }
        }
        
        // Use local balance if strategies don't have enough
        if (remaining > 0 && baseAsset.balanceOf(address(this)) < remaining) {
            revert InsufficientBalance();
        }
    }

    function _depositToStrategy(address vault, uint256 amount) internal {
        Strategy storage strategy = _strategies[vault];
        
        IERC4626(vault).deposit(amount, address(this));
        strategy.deposited += amount;
        
        emit DepositToStrategy(vault, amount);
    }

    function _withdrawFromStrategy(address vault, uint256 amount) internal {
        Strategy storage strategy = _strategies[vault];
        
        IERC4626(vault).withdraw(amount, address(this), address(this));
        strategy.deposited = strategy.deposited > amount ? strategy.deposited - amount : 0;
        
        emit WithdrawFromStrategy(vault, amount);
    }

    function _harvestFromStrategy(address vault) internal {
        Strategy storage strategy = _strategies[vault];
        
        uint256 currentValue = _getStrategyValue(vault);
        uint256 profit = currentValue > strategy.deposited ? currentValue - strategy.deposited : 0;
        
        if (profit > 0) {
            // Take performance fee
            uint256 fee = profit.bpsOf(_config.performanceFee);
            if (fee > 0 && _config.feeRecipient != address(0)) {
                // Withdraw fee amount
                IERC4626(vault).withdraw(fee, _config.feeRecipient, address(this));
            }
            
            strategy.totalYieldEarned += profit;
            _totalYieldEarned += profit;
            strategy.lastHarvest = block.timestamp;
            
            // Auto-compound remaining if enabled
            if (_config.autoCompound) {
                // Profit stays in vault, just update deposited amount
                strategy.deposited = currentValue - fee;
            }
            
            emit YieldClaimed(vault, profit);
        }
    }

    function _getStrategyValue(address vault) internal view returns (uint256) {
        uint256 shares = IERC4626(vault).balanceOf(address(this));
        return IERC4626(vault).convertToAssets(shares);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    function getStrategies() external view returns (Strategy[] memory) {
        Strategy[] memory strategies = new Strategy[](_strategyAddresses.length);
        for (uint256 i = 0; i < _strategyAddresses.length;) {
            strategies[i] = _strategies[_strategyAddresses[i]];
            unchecked { ++i; }
        }
        return strategies;
    }

    function getStrategy(address vault) external view returns (Strategy memory) {
        return _strategies[vault];
    }

    function getPortfolioMetrics() external view returns (PortfolioMetrics memory) {
        uint256 totalValue = totalValueLocked();
        
        // Calculate weighted APY and risk
        uint256 weightedAPY;
        uint256 weightedRisk;
        uint256 totalActiveAllocation;
        
        for (uint256 i = 0; i < _strategyAddresses.length;) {
            Strategy storage strategy = _strategies[_strategyAddresses[i]];
            if (strategy.active && strategy.allocation > 0) {
                // Simplified APY calculation (would use actual vault APY in production)
                weightedRisk += uint256(strategy.riskScore) * strategy.allocation;
                totalActiveAllocation += strategy.allocation;
            }
            unchecked { ++i; }
        }
        
        if (totalActiveAllocation > 0) {
            weightedRisk = weightedRisk / totalActiveAllocation;
        }
        
        return PortfolioMetrics({
            totalValue: totalValue,
            totalDeposited: _totalDeposited,
            totalYield: _totalYieldEarned,
            weightedAPY: weightedAPY,
            weightedRisk: weightedRisk,
            lastRebalance: _lastRebalance
        });
    }

    function getConfig() external view returns (AggregatorConfig memory) {
        return _config;
    }

    function calculateOptimalAllocation() external view returns (
        address[] memory vaults,
        uint256[] memory allocations
    ) {
        vaults = _strategyAddresses;
        allocations = new uint256[](_strategyAddresses.length);
        
        for (uint256 i = 0; i < _strategyAddresses.length;) {
            allocations[i] = _strategies[_strategyAddresses[i]].allocation;
            unchecked { ++i; }
        }
    }

    function totalValueLocked() public view returns (uint256) {
        uint256 tvl = baseAsset.balanceOf(address(this));
        
        for (uint256 i = 0; i < _strategyAddresses.length;) {
            tvl += _getStrategyValue(_strategyAddresses[i]);
            unchecked { ++i; }
        }
        
        return tvl;
    }

    function pendingYield() external view returns (uint256) {
        uint256 pending;
        
        for (uint256 i = 0; i < _strategyAddresses.length;) {
            address vault = _strategyAddresses[i];
            Strategy storage strategy = _strategies[vault];
            
            if (strategy.active) {
                uint256 currentValue = _getStrategyValue(vault);
                if (currentValue > strategy.deposited) {
                    pending += currentValue - strategy.deposited;
                }
            }
            unchecked { ++i; }
        }
        
        return pending;
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================
    
    function updateConfig(AggregatorConfig calldata newConfig) external onlyOwner {
        if (newConfig.feeRecipient == address(0)) revert ZeroAddress();
        
        emit PerformanceFeeUpdated(_config.performanceFee, newConfig.performanceFee);
        _config = newConfig;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
