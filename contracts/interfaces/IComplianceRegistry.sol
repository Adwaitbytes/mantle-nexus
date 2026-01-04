// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IComplianceRegistry
 * @notice Interface for the Compliance Registry
 * @dev Central registry for compliance status across the protocol
 */
interface IComplianceRegistry {
    // ============================================
    // EVENTS
    // ============================================
    
    event ComplianceStatusUpdated(address indexed account, bool compliant, uint256 timestamp);
    event VaultRegistered(address indexed vault, ComplianceLevel level);
    event VaultUnregistered(address indexed vault);
    event ComplianceLevelUpdated(address indexed vault, ComplianceLevel oldLevel, ComplianceLevel newLevel);
    event OperatorAdded(address indexed operator);
    event OperatorRemoved(address indexed operator);
    event AccountFrozen(address indexed account, string reason);
    event AccountUnfrozen(address indexed account);
    event TransferRestricted(address indexed from, address indexed to, address indexed vault);

    // ============================================
    // ERRORS
    // ============================================
    
    error AccountNotCompliant(address account);
    error AccountIsFrozen(address account);
    error VaultNotRegistered(address vault);
    error VaultAlreadyRegistered(address vault);
    error InsufficientComplianceLevel(ComplianceLevel required, ComplianceLevel actual);
    error NotOperator(address caller);
    error ZeroAddress();
    error TransferNotAllowed(address from, address to);

    // ============================================
    // ENUMS
    // ============================================
    
    enum ComplianceLevel {
        NONE,           // No compliance required
        BASIC,          // Basic KYC only
        STANDARD,       // KYC + AML
        ENHANCED,       // Full compliance (KYC + AML + Accreditation)
        INSTITUTIONAL   // Institutional-grade compliance
    }

    // ============================================
    // STRUCTS
    // ============================================
    
    struct AccountStatus {
        bool isCompliant;
        bool isFrozen;
        ComplianceLevel level;
        uint256 verifiedAt;
        uint256 expiresAt;
        bytes32 verificationHash;
    }

    struct VaultRequirements {
        address vault;
        ComplianceLevel requiredLevel;
        bool requiresAccreditation;
        bytes32[] allowedJurisdictions;
        bool active;
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    /// @notice Check if account can interact with vault
    function canInteract(address account, address vault) external view returns (bool);
    
    /// @notice Get account compliance status
    function getAccountStatus(address account) external view returns (AccountStatus memory);
    
    /// @notice Get vault requirements
    function getVaultRequirements(address vault) external view returns (VaultRequirements memory);
    
    /// @notice Check if transfer is allowed
    function canTransfer(address from, address to, address vault) external view returns (bool);
    
    /// @notice Get all registered vaults
    function getRegisteredVaults() external view returns (address[] memory);
    
    /// @notice Check if address is an operator
    function isOperator(address account) external view returns (bool);

    // ============================================
    // MUTATIVE FUNCTIONS
    // ============================================
    
    /// @notice Update compliance status for account
    function updateComplianceStatus(
        address account,
        bool compliant,
        ComplianceLevel level,
        uint256 expiry,
        bytes32 verificationHash
    ) external;
    
    /// @notice Register a vault with compliance requirements
    function registerVault(
        address vault,
        ComplianceLevel requiredLevel,
        bool requiresAccreditation,
        bytes32[] calldata allowedJurisdictions
    ) external;
    
    /// @notice Unregister a vault
    function unregisterVault(address vault) external;
    
    /// @notice Update vault compliance level
    function updateVaultLevel(address vault, ComplianceLevel newLevel) external;
    
    /// @notice Freeze an account
    function freezeAccount(address account, string calldata reason) external;
    
    /// @notice Unfreeze an account
    function unfreezeAccount(address account) external;
    
    /// @notice Add operator
    function addOperator(address operator) external;
    
    /// @notice Remove operator
    function removeOperator(address operator) external;
    
    /// @notice Batch update compliance status
    function batchUpdateCompliance(
        address[] calldata accounts,
        bool[] calldata compliant,
        ComplianceLevel[] calldata levels
    ) external;
}
