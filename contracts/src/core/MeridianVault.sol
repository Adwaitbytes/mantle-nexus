// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {IMeridianVault} from "../interfaces/IMeridianVault.sol";
import {IComplianceManager} from "../interfaces/IComplianceManager.sol";

/**
 * @title MeridianVault
 * @notice ERC-4626 compliant tokenized vault for Real World Assets (RWAs)
 * @dev Implements institutional-grade features: compliance checks, yield harvesting, fee management
 * @author MERIDIAN Protocol
 */
contract MeridianVault is ERC4626, Ownable, ReentrancyGuard, Pausable, IMeridianVault {
    using SafeERC20 for IERC20;
    using Math for uint256;

    uint256 public constant MAX_FEE = 3_000;
    uint256 public constant BASIS_POINTS = 10_000;
    uint256 public constant SECONDS_PER_YEAR = 365.25 days;

    VaultConfig private _vaultConfig;
    AssetMetadata private _assetMetadata;
    IComplianceManager public complianceManager;
    address public feeRecipient;
    uint256 public override totalYieldGenerated;
    uint256 public override currentEpoch;
    uint256 public lastHarvestTime;
    uint256 public accumulatedYieldPerShare;
    uint256 public highWaterMark;
    mapping(address => uint256) public pendingWithdrawals;
    mapping(address => uint256) public withdrawalRequestTime;

    constructor(
        IERC20 asset_,
        string memory name_,
        string memory symbol_,
        VaultConfig memory config_,
        AssetMetadata memory metadata_,
        address complianceManager_,
        address feeRecipient_,
        address owner_
    ) ERC4626(asset_) ERC20(name_, symbol_) Ownable(owner_) {
        require(config_.managementFee <= MAX_FEE, "Management fee too high");
        require(config_.performanceFee <= MAX_FEE, "Performance fee too high");
        require(feeRecipient_ != address(0), "Invalid fee recipient");
        _vaultConfig = config_;
        _assetMetadata = metadata_;
        complianceManager = IComplianceManager(complianceManager_);
        feeRecipient = feeRecipient_;
        lastHarvestTime = block.timestamp;
        highWaterMark = 1e18;
    }

    modifier onlyCompliant(address user) {
        if (_vaultConfig.requiresCompliance) {
            if (address(complianceManager) != address(0)) {
                if (!complianceManager.isCompliantForVault(user, address(this))) {
                    revert NotCompliant(user);
                }
            }
        }
        _;
    }

    modifier whenNotVaultPaused() {
        if (paused()) { revert VaultIsPaused(); }
        _;
    }

    function getVaultConfig() external view override returns (VaultConfig memory) {
        return _vaultConfig;
    }

    function getAssetMetadata() external view override returns (AssetMetadata memory) {
        return _assetMetadata;
    }

    function currentAPY() external view override returns (uint256) {
        if (totalSupply() == 0 || totalYieldGenerated == 0) return 0;
        uint256 timeElapsed = block.timestamp - lastHarvestTime;
        if (timeElapsed == 0) return 0;
        uint256 currentAssets = totalAssets();
        if (currentAssets == 0) return 0;
        return (totalYieldGenerated * SECONDS_PER_YEAR * BASIS_POINTS) / (currentAssets * timeElapsed);
    }

    function availableLiquidity() external view override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this));
    }

    function isUserCompliant(address user) external view override returns (bool) {
        if (!_vaultConfig.requiresCompliance) return true;
        if (address(complianceManager) == address(0)) return true;
        return complianceManager.isCompliantForVault(user, address(this));
    }

    function totalAssets() public view override(ERC4626, IERC4626) returns (uint256) {
        return IERC20(asset()).balanceOf(address(this));
    }

    function deposit(
        uint256 assets,
        address receiver
    ) public override(ERC4626, IERC4626) nonReentrant whenNotVaultPaused onlyCompliant(receiver) returns (uint256 shares) {
        if (assets < _vaultConfig.minimumDeposit) revert BelowMinimumDeposit(assets, _vaultConfig.minimumDeposit);
        shares = super.deposit(assets, receiver);
        return shares;
    }

    function mint(
        uint256 shares,
        address receiver
    ) public override(ERC4626, IERC4626) nonReentrant whenNotVaultPaused onlyCompliant(receiver) returns (uint256 assets) {
        assets = super.mint(shares, receiver);
        if (assets < _vaultConfig.minimumDeposit) revert BelowMinimumDeposit(assets, _vaultConfig.minimumDeposit);
        return assets;
    }

    function withdraw(
        uint256 assets,
        address receiver,
        address owner_
    ) public override(ERC4626, IERC4626) nonReentrant whenNotVaultPaused onlyCompliant(receiver) returns (uint256 shares) {
        uint256 available = IERC20(asset()).balanceOf(address(this));
        if (assets > available) revert InsufficientLiquidity(assets, available);
        shares = super.withdraw(assets, receiver, owner_);
        return shares;
    }

    function redeem(
        uint256 shares,
        address receiver,
        address owner_
    ) public override(ERC4626, IERC4626) nonReentrant whenNotVaultPaused onlyCompliant(receiver) returns (uint256 assets) {
        assets = previewRedeem(shares);
        uint256 available = IERC20(asset()).balanceOf(address(this));
        if (assets > available) revert InsufficientLiquidity(assets, available);
        assets = super.redeem(shares, receiver, owner_);
        return assets;
    }

    function harvestYield() external override nonReentrant returns (uint256 yieldAmount) {
        uint256 currentBalance = IERC20(asset()).balanceOf(address(this));
        uint256 expectedBalance = convertToAssets(totalSupply());
        if (currentBalance <= expectedBalance) return 0;
        yieldAmount = currentBalance - expectedBalance;

        uint256 performanceFee = 0;
        uint256 sharePrice = totalSupply() > 0 ? (currentBalance * 1e18) / totalSupply() : 1e18;

        if (sharePrice > highWaterMark && _vaultConfig.performanceFee > 0) {
            uint256 profit = ((sharePrice - highWaterMark) * totalSupply()) / 1e18;
            performanceFee = (profit * _vaultConfig.performanceFee) / BASIS_POINTS;
            highWaterMark = sharePrice;
        }

        if (performanceFee > 0 && feeRecipient != address(0)) {
            IERC20(asset()).safeTransfer(feeRecipient, performanceFee);
            yieldAmount -= performanceFee;
        }

        totalYieldGenerated += yieldAmount;
        currentEpoch++;
        lastHarvestTime = block.timestamp;

        if (totalSupply() > 0) {
            accumulatedYieldPerShare += (yieldAmount * 1e18) / totalSupply();
        }

        emit YieldHarvested(currentEpoch, yieldAmount, block.timestamp);
        return yieldAmount;
    }

    function updateVaultConfig(VaultConfig calldata newConfig) external override onlyOwner {
        if (newConfig.managementFee > MAX_FEE) revert InvalidFeeConfiguration(newConfig.managementFee);
        if (newConfig.performanceFee > MAX_FEE) revert InvalidFeeConfiguration(newConfig.performanceFee);
        _vaultConfig = newConfig;
        emit VaultParametersUpdated(newConfig.managementFee, newConfig.performanceFee);
    }

    function setPaused(bool paused_) external override onlyOwner {
        if (paused_) _pause();
        else _unpause();
        emit VaultPaused(paused_);
    }

    function setComplianceManager(address newManager) external onlyOwner {
        complianceManager = IComplianceManager(newManager);
    }

    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid fee recipient");
        feeRecipient = newRecipient;
    }

    function updateAssetMetadata(AssetMetadata calldata metadata_) external onlyOwner {
        _assetMetadata = metadata_;
    }

    function rescueTokens(IERC20 token, uint256 amount) external onlyOwner {
        require(address(token) != asset(), "Cannot rescue underlying asset");
        token.safeTransfer(owner(), amount);
    }

    function _update(address from, address to, uint256 value) internal override {
        super._update(from, to, value);
    }
}
