// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {IComplianceRegistry} from "../interfaces/IComplianceRegistry.sol";
import {ComplianceLib} from "../libraries/ComplianceLib.sol";

/**
 * @title ComplianceRegistry
 * @notice Central registry for compliance status across Meridian protocol
 * @dev Manages account compliance, vault requirements, and transfer restrictions
 * 
 * Features:
 * - Account compliance tracking
 * - Vault compliance requirements
 * - Transfer restrictions
 * - Operator management
 * - Account freezing
 */
contract ComplianceRegistry is IComplianceRegistry, Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using ComplianceLib for bytes32;

    // ============================================
    // STATE VARIABLES
    // ============================================
    
    /// @notice Account compliance status
    mapping(address => AccountStatus) private _accountStatus;
    
    /// @notice Vault compliance requirements
    mapping(address => VaultRequirements) private _vaultRequirements;
    
    /// @notice Registered vaults
    EnumerableSet.AddressSet private _registeredVaults;
    
    /// @notice Authorized operators
    EnumerableSet.AddressSet private _operators;
    
    /// @notice ZK-KYC Verifier address
    address public zkKYCVerifier;

    // ============================================
    // MODIFIERS
    // ============================================
    
    modifier onlyOperator() {
        if (!_operators.contains(msg.sender) && msg.sender != owner()) {
            revert NotOperator(msg.sender);
        }
        _;
    }

    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    constructor(address _zkKYCVerifier) Ownable(msg.sender) {
        zkKYCVerifier = _zkKYCVerifier;
        _operators.add(msg.sender);
    }

    // ============================================
    // COMPLIANCE STATUS MANAGEMENT
    // ============================================
    
    /**
     * @notice Update compliance status for an account
     */
    function updateComplianceStatus(
        address account,
        bool compliant,
        ComplianceLevel level,
        uint256 expiry,
        bytes32 verificationHash
    ) external onlyOperator {
        if (account == address(0)) revert ZeroAddress();
        
        _accountStatus[account] = AccountStatus({
            isCompliant: compliant,
            isFrozen: _accountStatus[account].isFrozen, // Preserve frozen status
            level: level,
            verifiedAt: block.timestamp,
            expiresAt: expiry,
            verificationHash: verificationHash
        });
        
        emit ComplianceStatusUpdated(account, compliant, block.timestamp);
    }

    /**
     * @notice Batch update compliance status
     */
    function batchUpdateCompliance(
        address[] calldata accounts,
        bool[] calldata compliant,
        ComplianceLevel[] calldata levels
    ) external onlyOperator {
        require(
            accounts.length == compliant.length && accounts.length == levels.length,
            "Length mismatch"
        );
        
        for (uint256 i = 0; i < accounts.length;) {
            if (accounts[i] == address(0)) revert ZeroAddress();
            
            _accountStatus[accounts[i]].isCompliant = compliant[i];
            _accountStatus[accounts[i]].level = levels[i];
            _accountStatus[accounts[i]].verifiedAt = block.timestamp;
            
            emit ComplianceStatusUpdated(accounts[i], compliant[i], block.timestamp);
            
            unchecked { ++i; }
        }
    }

    // ============================================
    // VAULT MANAGEMENT
    // ============================================
    
    /**
     * @notice Register a vault with compliance requirements
     */
    function registerVault(
        address vault,
        ComplianceLevel requiredLevel,
        bool requiresAccreditation,
        bytes32[] calldata allowedJurisdictions
    ) external onlyOwner {
        if (vault == address(0)) revert ZeroAddress();
        if (_registeredVaults.contains(vault)) revert VaultAlreadyRegistered(vault);
        
        _vaultRequirements[vault] = VaultRequirements({
            vault: vault,
            requiredLevel: requiredLevel,
            requiresAccreditation: requiresAccreditation,
            allowedJurisdictions: allowedJurisdictions,
            active: true
        });
        
        _registeredVaults.add(vault);
        
        emit VaultRegistered(vault, requiredLevel);
    }

    /**
     * @notice Unregister a vault
     */
    function unregisterVault(address vault) external onlyOwner {
        if (!_registeredVaults.contains(vault)) revert VaultNotRegistered(vault);
        
        _vaultRequirements[vault].active = false;
        _registeredVaults.remove(vault);
        
        emit VaultUnregistered(vault);
    }

    /**
     * @notice Update vault compliance level
     */
    function updateVaultLevel(address vault, ComplianceLevel newLevel) external onlyOwner {
        if (!_registeredVaults.contains(vault)) revert VaultNotRegistered(vault);
        
        ComplianceLevel oldLevel = _vaultRequirements[vault].requiredLevel;
        _vaultRequirements[vault].requiredLevel = newLevel;
        
        emit ComplianceLevelUpdated(vault, oldLevel, newLevel);
    }

    // ============================================
    // ACCOUNT FREEZING
    // ============================================
    
    /**
     * @notice Freeze an account
     */
    function freezeAccount(address account, string calldata reason) external onlyOperator {
        if (account == address(0)) revert ZeroAddress();
        
        _accountStatus[account].isFrozen = true;
        
        emit AccountFrozen(account, reason);
    }

    /**
     * @notice Unfreeze an account
     */
    function unfreezeAccount(address account) external onlyOperator {
        if (account == address(0)) revert ZeroAddress();
        
        _accountStatus[account].isFrozen = false;
        
        emit AccountUnfrozen(account);
    }

    // ============================================
    // OPERATOR MANAGEMENT
    // ============================================
    
    /**
     * @notice Add an operator
     */
    function addOperator(address operator) external onlyOwner {
        if (operator == address(0)) revert ZeroAddress();
        
        _operators.add(operator);
        
        emit OperatorAdded(operator);
    }

    /**
     * @notice Remove an operator
     */
    function removeOperator(address operator) external onlyOwner {
        _operators.remove(operator);
        
        emit OperatorRemoved(operator);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    /**
     * @notice Check if account can interact with vault
     */
    function canInteract(address account, address vault) external view returns (bool) {
        // Check if account is frozen
        if (_accountStatus[account].isFrozen) return false;
        
        // If vault not registered, allow interaction
        if (!_registeredVaults.contains(vault)) return true;
        
        VaultRequirements storage requirements = _vaultRequirements[vault];
        AccountStatus storage status = _accountStatus[account];
        
        // Check if compliant
        if (!status.isCompliant) return false;
        
        // Check if expired
        if (status.expiresAt > 0 && block.timestamp >= status.expiresAt) return false;
        
        // Check compliance level
        if (uint8(status.level) < uint8(requirements.requiredLevel)) return false;
        
        return true;
    }

    /**
     * @notice Get account compliance status
     */
    function getAccountStatus(address account) external view returns (AccountStatus memory) {
        return _accountStatus[account];
    }

    /**
     * @notice Get vault requirements
     */
    function getVaultRequirements(address vault) external view returns (VaultRequirements memory) {
        return _vaultRequirements[vault];
    }

    /**
     * @notice Check if transfer is allowed
     */
    function canTransfer(address from, address to, address vault) external view returns (bool) {
        // Check if either party is frozen
        if (_accountStatus[from].isFrozen || _accountStatus[to].isFrozen) {
            return false;
        }
        
        // If vault not registered, allow transfer
        if (!_registeredVaults.contains(vault)) return true;
        
        VaultRequirements storage requirements = _vaultRequirements[vault];
        
        // Both parties must meet vault requirements
        AccountStatus storage fromStatus = _accountStatus[from];
        AccountStatus storage toStatus = _accountStatus[to];
        
        if (!fromStatus.isCompliant || !toStatus.isCompliant) return false;
        
        if (uint8(fromStatus.level) < uint8(requirements.requiredLevel)) return false;
        if (uint8(toStatus.level) < uint8(requirements.requiredLevel)) return false;
        
        return true;
    }

    /**
     * @notice Get all registered vaults
     */
    function getRegisteredVaults() external view returns (address[] memory) {
        return _registeredVaults.values();
    }

    /**
     * @notice Check if address is an operator
     */
    function isOperator(address account) external view returns (bool) {
        return _operators.contains(account);
    }

    /**
     * @notice Get all operators
     */
    function getOperators() external view returns (address[] memory) {
        return _operators.values();
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================
    
    /**
     * @notice Update ZK-KYC Verifier address
     */
    function setZKKYCVerifier(address _newVerifier) external onlyOwner {
        zkKYCVerifier = _newVerifier;
    }
}
