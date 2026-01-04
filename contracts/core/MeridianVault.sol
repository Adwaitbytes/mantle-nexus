// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {IMeridianVault} from "../interfaces/IMeridianVault.sol";
import {IComplianceRegistry} from "../interfaces/IComplianceRegistry.sol";
import {MeridianMath} from "../libraries/MeridianMath.sol";

/**
 * @title MeridianVault
 * @notice ERC-4626 compliant tokenized vault for Real World Assets
 * @dev Integrates with compliance registry and oracle for RWA management
 * 
 * Features:
 * - ERC-4626 standard yield vault
 * - Compliance-gated deposits/withdrawals
 * - Oracle-based asset valuation
 * - Time-locked withdrawals for illiquid assets
 * - Performance and management fees
 */
contract MeridianVault is ERC4626, IMeridianVault, ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;
    using MeridianMath for uint256;
    using Math for uint256;

    // ============================================
    // STATE VARIABLES
    // ============================================
    
    /// @notice Vault configuration
    VaultConfig private _config;
    
    /// @notice Total yield generated
    uint256 private _totalYieldGenerated;
    
    /// @notice Last oracle price update
    uint256 private _lastPriceUpdate;
    
    /// @notice Current APY in basis points
    uint256 private _currentAPY;
    
    /// @notice Last fee collection timestamp
    uint256 private _lastFeeCollection;
    
    /// @notice Accumulated management fees
    uint256 private _accumulatedManagementFees;
    
    /// @notice Withdraw request counter
    uint256 private _withdrawRequestCounter;
    
    /// @notice Mapping of withdraw requests
    mapping(uint256 => WithdrawRequest) private _withdrawRequests;
    
    /// @notice User's pending withdraw request IDs
    mapping(address => uint256[]) private _userWithdrawRequests;
    
    /// @notice Additional asset value from oracle (for RWA appreciation)
    uint256 private _oracleAssetValue;

    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    constructor(
        IERC20 asset_,
        string memory name_,
        string memory symbol_,
        VaultConfig memory config_
    ) 
        ERC4626(asset_)
        ERC20(name_, symbol_)
        Ownable(msg.sender)
    {
        if (config_.feeRecipient == address(0)) revert InvalidAddress();
        if (config_.performanceFee > 3000) revert InvalidAddress(); // Max 30%
        if (config_.managementFee > 500) revert InvalidAddress(); // Max 5%
        
        _config = config_;
        _lastFeeCollection = block.timestamp;
        _lastPriceUpdate = block.timestamp;
    }

    // ============================================
    // ERC-4626 OVERRIDES
    // ============================================
    
    /**
     * @notice Total assets including oracle-reported value
     */
    function totalAssets() public view override(ERC4626, IERC4626) returns (uint256) {
        uint256 baseAssets = IERC20(asset()).balanceOf(address(this));
        return baseAssets + _oracleAssetValue;
    }

    /**
     * @notice Deposit with compliance check
     */
    function deposit(
        uint256 assets,
        address receiver
    ) public override(ERC4626, IERC4626) nonReentrant whenNotPaused returns (uint256 shares) {
        if (assets == 0) revert ZeroAmount();
        if (receiver == address(0)) revert InvalidAddress();
        
        // Compliance check
        if (_config.requiresCompliance && !_checkCompliance(receiver)) {
            revert NotCompliant(receiver);
        }
        
        // Check deposit limit
        if (_config.depositLimit > 0 && totalAssets() + assets > _config.depositLimit) {
            revert DepositLimitExceeded(assets, _config.depositLimit - totalAssets());
        }
        
        // Collect fees before deposit
        _collectManagementFees();
        
        shares = super.deposit(assets, receiver);
    }

    /**
     * @notice Mint with compliance check
     */
    function mint(
        uint256 shares,
        address receiver
    ) public override(ERC4626, IERC4626) nonReentrant whenNotPaused returns (uint256 assets) {
        if (shares == 0) revert ZeroAmount();
        if (receiver == address(0)) revert InvalidAddress();
        
        // Compliance check
        if (_config.requiresCompliance && !_checkCompliance(receiver)) {
            revert NotCompliant(receiver);
        }
        
        // Collect fees before mint
        _collectManagementFees();
        
        assets = super.mint(shares, receiver);
        
        // Check deposit limit after
        if (_config.depositLimit > 0 && totalAssets() > _config.depositLimit) {
            revert DepositLimitExceeded(assets, _config.depositLimit);
        }
    }

    /**
     * @notice Withdraw with compliance check
     */
    function withdraw(
        uint256 assets,
        address receiver,
        address owner_
    ) public override(ERC4626, IERC4626) nonReentrant whenNotPaused returns (uint256 shares) {
        if (assets == 0) revert ZeroAmount();
        if (receiver == address(0)) revert InvalidAddress();
        
        // Compliance check for receiver
        if (_config.requiresCompliance && !_checkCompliance(receiver)) {
            revert NotCompliant(receiver);
        }
        
        // Check available liquidity
        uint256 available = availableLiquidity();
        if (assets > available) {
            revert InsufficientLiquidity(assets, available);
        }
        
        // Collect fees before withdrawal
        _collectManagementFees();
        
        shares = super.withdraw(assets, receiver, owner_);
    }

    /**
     * @notice Redeem with compliance check
     */
    function redeem(
        uint256 shares,
        address receiver,
        address owner_
    ) public override(ERC4626, IERC4626) nonReentrant whenNotPaused returns (uint256 assets) {
        if (shares == 0) revert ZeroAmount();
        if (receiver == address(0)) revert InvalidAddress();
        
        // Compliance check for receiver
        if (_config.requiresCompliance && !_checkCompliance(receiver)) {
            revert NotCompliant(receiver);
        }
        
        // Collect fees before redemption
        _collectManagementFees();
        
        // Check available liquidity BEFORE redemption
        uint256 previewedAssets = previewRedeem(shares);
        uint256 available = availableLiquidity();
        if (previewedAssets > available) {
            revert InsufficientLiquidity(previewedAssets, available);
        }
        
        assets = super.redeem(shares, receiver, owner_);
    }

    // ============================================
    // WITHDRAW REQUEST SYSTEM
    // ============================================
    
    /**
     * @notice Request a withdrawal (for locked assets)
     */
    function requestWithdraw(
        uint256 shares,
        uint256 minAssets
    ) external nonReentrant whenNotPaused returns (uint256 requestId) {
        if (shares == 0) revert ZeroAmount();
        if (balanceOf(msg.sender) < shares) revert InsufficientLiquidity(shares, balanceOf(msg.sender));
        
        // Lock the shares
        _transfer(msg.sender, address(this), shares);
        
        requestId = ++_withdrawRequestCounter;
        
        _withdrawRequests[requestId] = WithdrawRequest({
            owner: msg.sender,
            shares: shares,
            requestTime: block.timestamp,
            minAssets: minAssets,
            processed: false
        });
        
        _userWithdrawRequests[msg.sender].push(requestId);
        
        emit WithdrawRequestCreated(msg.sender, shares, requestId);
    }

    /**
     * @notice Process a pending withdrawal request
     */
    function processWithdraw(uint256 requestId) external nonReentrant returns (uint256 assets) {
        WithdrawRequest storage request = _withdrawRequests[requestId];
        
        if (request.owner == address(0)) revert InvalidWithdrawRequest(requestId);
        if (request.processed) revert InvalidWithdrawRequest(requestId);
        
        // Check lock period
        uint256 unlockTime = request.requestTime + _config.withdrawLockPeriod;
        if (block.timestamp < unlockTime) {
            revert WithdrawRequestNotReady(requestId);
        }
        
        // Only owner or the original requester can process
        if (msg.sender != request.owner && msg.sender != owner()) {
            revert NotAuthorized();
        }
        
        request.processed = true;
        
        // Calculate assets
        assets = convertToAssets(request.shares);
        
        if (assets < request.minAssets) {
            revert InsufficientLiquidity(request.minAssets, assets);
        }
        
        // Burn shares and transfer assets
        _burn(address(this), request.shares);
        IERC20(asset()).safeTransfer(request.owner, assets);
        
        emit WithdrawRequestProcessed(requestId, assets);
    }

    /**
     * @notice Emergency withdraw with penalty
     */
    function emergencyWithdraw(uint256 shares) external nonReentrant returns (uint256 assets) {
        if (shares == 0) revert ZeroAmount();
        if (balanceOf(msg.sender) < shares) revert InsufficientLiquidity(shares, balanceOf(msg.sender));
        
        // 5% penalty for emergency withdrawal
        uint256 penalty = shares.bpsOf(500);
        uint256 netShares = shares - penalty;
        
        assets = convertToAssets(netShares);
        
        // Transfer penalty to fee recipient
        if (penalty > 0) {
            _transfer(msg.sender, _config.feeRecipient, penalty);
        }
        
        // Burn remaining shares and transfer
        _burn(msg.sender, netShares);
        IERC20(asset()).safeTransfer(msg.sender, assets);
        
        emit EmergencyWithdraw(msg.sender, assets);
    }

    // ============================================
    // YIELD MANAGEMENT
    // ============================================
    
    /**
     * @notice Harvest yield from underlying RWA
     * @dev Called by oracle/admin when yield is distributed
     */
    function harvestYield() external onlyOwner {
        // Get current value from oracle
        uint256 currentValue = totalAssets();
        uint256 previousValue = _oracleAssetValue + IERC20(asset()).balanceOf(address(this));
        
        if (currentValue > previousValue) {
            uint256 yield = currentValue - previousValue;
            
            // Take performance fee
            uint256 performanceFee = yield.bpsOf(_config.performanceFee);
            if (performanceFee > 0) {
                // Mint shares to fee recipient for fee
                uint256 feeShares = convertToShares(performanceFee);
                _mint(_config.feeRecipient, feeShares);
                
                emit PerformanceFeeCollected(performanceFee, _config.feeRecipient);
            }
            
            _totalYieldGenerated += yield;
            emit YieldHarvested(yield, block.timestamp);
        }
    }

    /**
     * @notice Update asset value from oracle
     */
    function updateAssetValue() external onlyOwner {
        // In production, this would fetch from Pyth or Chainlink
        // For now, it's manually updated
        _lastPriceUpdate = block.timestamp;
        emit AssetValueUpdated(_oracleAssetValue, _oracleAssetValue, block.timestamp);
    }

    /**
     * @notice Set oracle asset value (admin only)
     * @dev In production, this would be called by oracle contract
     */
    function setOracleAssetValue(uint256 newValue) external onlyOwner {
        uint256 oldValue = _oracleAssetValue;
        _oracleAssetValue = newValue;
        _lastPriceUpdate = block.timestamp;
        
        emit AssetValueUpdated(oldValue, newValue, block.timestamp);
    }

    // ============================================
    // FEE MANAGEMENT
    // ============================================
    
    /**
     * @notice Collect accumulated management fees
     */
    function _collectManagementFees() internal {
        if (_config.managementFee == 0) return;
        
        uint256 timeSinceLastCollection = block.timestamp - _lastFeeCollection;
        if (timeSinceLastCollection == 0) return;
        
        // Calculate fee: (totalAssets * managementFee * timePassed) / (BPS * YEAR)
        uint256 fee = (totalAssets() * _config.managementFee * timeSinceLastCollection) 
            / (MeridianMath.BPS * MeridianMath.SECONDS_PER_YEAR);
        
        if (fee > 0) {
            uint256 feeShares = convertToShares(fee);
            _mint(_config.feeRecipient, feeShares);
            
            _accumulatedManagementFees += fee;
            emit ManagementFeeCollected(fee, _config.feeRecipient);
        }
        
        _lastFeeCollection = block.timestamp;
    }

    // ============================================
    // COMPLIANCE
    // ============================================
    
    /**
     * @notice Check if account is compliant
     */
    function _checkCompliance(address account) internal view returns (bool) {
        if (_config.complianceRegistry == address(0)) return true;
        
        return IComplianceRegistry(_config.complianceRegistry).canInteract(account, address(this));
    }

    /**
     * @notice Public compliance check
     */
    function isCompliant(address account) external view returns (bool) {
        return _checkCompliance(account);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    function getConfig() external view returns (VaultConfig memory) {
        return _config;
    }

    function totalYieldGenerated() external view returns (uint256) {
        return _totalYieldGenerated;
    }

    function currentAPY() external view returns (uint256) {
        return _currentAPY;
    }

    function lastPriceUpdate() external view returns (uint256) {
        return _lastPriceUpdate;
    }

    function getWithdrawRequest(uint256 requestId) external view returns (WithdrawRequest memory) {
        return _withdrawRequests[requestId];
    }

    function availableLiquidity() public view returns (uint256) {
        return IERC20(asset()).balanceOf(address(this));
    }

    function getUserWithdrawRequests(address user) external view returns (uint256[] memory) {
        return _userWithdrawRequests[user];
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================
    
    /**
     * @notice Update vault configuration
     */
    function updateConfig(VaultConfig calldata newConfig) external onlyOwner {
        if (newConfig.feeRecipient == address(0)) revert InvalidAddress();
        if (newConfig.performanceFee > 3000) revert InvalidAddress(); // Max 30%
        if (newConfig.managementFee > 500) revert InvalidAddress(); // Max 5%
        
        emit DepositLimitUpdated(_config.depositLimit, newConfig.depositLimit);
        
        _config = newConfig;
    }

    /**
     * @notice Set APY (updated by oracle)
     */
    function setAPY(uint256 apyBps) external onlyOwner {
        _currentAPY = apyBps;
    }

    /**
     * @notice Pause the vault
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the vault
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
