// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IZKKYCVerifier
 * @notice Interface for Zero-Knowledge KYC Verification
 * @dev Enables privacy-preserving compliance checks
 */
interface IZKKYCVerifier {
    // ============================================
    // EVENTS
    // ============================================
    
    event CredentialIssued(
        address indexed account,
        bytes32 indexed credentialHash,
        uint256 expiry,
        CredentialType credentialType
    );
    event CredentialRevoked(address indexed account, bytes32 indexed credentialHash, string reason);
    event VerificationCompleted(address indexed account, bool success, bytes32 proofHash);
    event IssuerAdded(address indexed issuer, string name);
    event IssuerRemoved(address indexed issuer);
    event JurisdictionAdded(bytes32 indexed jurisdictionCode, string name);
    event JurisdictionBlocked(bytes32 indexed jurisdictionCode);
    event AccreditationVerified(address indexed account, AccreditationType accreditationType);
    event SelectiveDisclosure(address indexed account, bytes32 indexed fieldHash, address indexed requester);

    // ============================================
    // ERRORS
    // ============================================
    
    error InvalidProof();
    error CredentialExpired(bytes32 credentialHash);
    error CredentialIsRevoked(bytes32 credentialHash);
    error IssuerNotAuthorized(address issuer);
    error JurisdictionIsBlocked(bytes32 jurisdictionCode);
    error AlreadyVerified(address account);
    error NotVerified(address account);
    error InvalidCredentialType();
    error ProofAlreadyUsed(bytes32 proofHash);
    error InvalidExpiry();
    error ZeroAddress();

    // ============================================
    // ENUMS
    // ============================================
    
    enum CredentialType {
        IDENTITY,           // Basic identity verification
        ACCREDITATION,      // Accredited investor status
        JURISDICTION,       // Jurisdiction verification
        AML,               // Anti-money laundering check
        SANCTIONS,         // Sanctions screening
        TAX_RESIDENCY      // Tax residency verification
    }

    enum AccreditationType {
        NONE,
        QUALIFIED_PURCHASER,     // >$5M investments
        ACCREDITED_INVESTOR,     // >$1M net worth or >$200K income
        INSTITUTIONAL,           // Institutional investor
        PROFESSIONAL             // Professional investor (EU)
    }

    // ============================================
    // STRUCTS
    // ============================================
    
    struct Credential {
        bytes32 credentialHash;
        address issuer;
        uint256 issuedAt;
        uint256 expiresAt;
        CredentialType credentialType;
        bool revoked;
        bytes32 merkleRoot; // Root of credential data merkle tree
    }

    struct VerificationStatus {
        bool isVerified;
        uint256 verifiedAt;
        uint256 expiresAt;
        bytes32[] credentialHashes;
        AccreditationType accreditation;
        bytes32 jurisdictionCode;
    }

    struct ZKProof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
        uint256[] publicInputs;
    }

    struct Issuer {
        address issuerAddress;
        string name;
        bool active;
        uint256 addedAt;
        CredentialType[] allowedTypes;
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    /// @notice Check if an account is verified
    function isVerified(address account) external view returns (bool);
    
    /// @notice Get full verification status
    function getVerificationStatus(address account) external view returns (VerificationStatus memory);
    
    /// @notice Get a specific credential
    function getCredential(bytes32 credentialHash) external view returns (Credential memory);
    
    /// @notice Check if an issuer is authorized
    function isAuthorizedIssuer(address issuer) external view returns (bool);
    
    /// @notice Get all credentials for an account
    function getCredentials(address account) external view returns (Credential[] memory);
    
    /// @notice Check accreditation status
    function getAccreditation(address account) external view returns (AccreditationType);
    
    /// @notice Check if jurisdiction is allowed
    function isJurisdictionAllowed(bytes32 jurisdictionCode) external view returns (bool);
    
    /// @notice Verify a ZK proof without state changes (for checking)
    function verifyProof(ZKProof calldata proof, bytes32 credentialType) external view returns (bool);

    // ============================================
    // MUTATIVE FUNCTIONS
    // ============================================
    
    /// @notice Submit ZK proof to verify identity
    /// @param proof The zero-knowledge proof
    /// @param credentialHash Hash of the credential being proven
    function submitProof(ZKProof calldata proof, bytes32 credentialHash) external;
    
    /// @notice Issue a new credential (issuer only)
    /// @param account Account to issue credential to
    /// @param credentialType Type of credential
    /// @param expiry Expiration timestamp
    /// @param merkleRoot Merkle root of credential data
    /// @return credentialHash The hash of the issued credential
    function issueCredential(
        address account,
        CredentialType credentialType,
        uint256 expiry,
        bytes32 merkleRoot
    ) external returns (bytes32 credentialHash);
    
    /// @notice Revoke a credential (issuer only)
    /// @param credentialHash Hash of the credential to revoke
    /// @param reason Reason for revocation
    function revokeCredential(bytes32 credentialHash, string calldata reason) external;
    
    /// @notice Request selective disclosure of credential data
    /// @param account Account to request disclosure from
    /// @param fieldHashes Hashes of fields to disclose
    function requestDisclosure(address account, bytes32[] calldata fieldHashes) external;
    
    /// @notice Verify accreditation with proof
    /// @param proof ZK proof of accreditation
    /// @param accreditationType Type of accreditation claimed
    function verifyAccreditation(ZKProof calldata proof, AccreditationType accreditationType) external;
    
    /// @notice Batch verify multiple accounts
    /// @param accounts Accounts to verify
    /// @return results Verification results for each account
    function batchVerify(address[] calldata accounts) external view returns (bool[] memory results);
}
