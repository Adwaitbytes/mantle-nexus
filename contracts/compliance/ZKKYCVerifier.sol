// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {IZKKYCVerifier} from "../interfaces/IZKKYCVerifier.sol";
import {IComplianceRegistry} from "../interfaces/IComplianceRegistry.sol";
import {ComplianceLib} from "../libraries/ComplianceLib.sol";

/**
 * @title ZKKYCVerifier
 * @notice Zero-Knowledge KYC Verification for privacy-preserving compliance
 * @dev Enables users to prove compliance without revealing personal data
 * 
 * Features:
 * - ZK proof verification (Groth16 compatible)
 * - Credential issuance and management
 * - Selective disclosure
 * - Multi-issuer support
 * - Accreditation verification
 */
contract ZKKYCVerifier is IZKKYCVerifier, Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using ComplianceLib for bytes32;

    // ============================================
    // STATE VARIABLES
    // ============================================
    
    /// @notice Compliance registry address
    IComplianceRegistry public complianceRegistry;
    
    /// @notice Authorized issuers
    mapping(address => Issuer) private _issuers;
    EnumerableSet.AddressSet private _issuerAddresses;
    
    /// @notice Credentials by hash
    mapping(bytes32 => Credential) private _credentials;
    
    /// @notice Account credentials
    mapping(address => EnumerableSet.Bytes32Set) private _accountCredentials;
    
    /// @notice Account verification status
    mapping(address => VerificationStatus) private _verificationStatus;
    
    /// @notice Used proof hashes (prevent replay)
    mapping(bytes32 => bool) private _usedProofs;
    
    /// @notice Blocked jurisdictions
    mapping(bytes32 => bool) private _blockedJurisdictions;
    
    /// @notice Default credential validity period (1 year)
    uint256 public constant DEFAULT_VALIDITY = 365 days;
    
    /// @notice Verifier contract for ZK proofs (would be deployed separately)
    address public zkVerifierContract;

    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    constructor(address _complianceRegistry) Ownable(msg.sender) {
        complianceRegistry = IComplianceRegistry(_complianceRegistry);
        
        // Add deployer as initial issuer
        _addIssuer(msg.sender, "Meridian Protocol", _getAllCredentialTypes());
    }

    // ============================================
    // PROOF VERIFICATION
    // ============================================
    
    /**
     * @notice Submit ZK proof to verify identity
     */
    function submitProof(ZKProof calldata proof, bytes32 credentialHash) external {
        // Check credential exists and is valid
        Credential storage credential = _credentials[credentialHash];
        if (credential.credentialHash == bytes32(0)) revert InvalidProof();
        if (credential.revoked) revert CredentialIsRevoked(credentialHash);
        if (block.timestamp >= credential.expiresAt) revert CredentialExpired(credentialHash);
        
        // Hash the proof to prevent replay
        bytes32 proofHash = ComplianceLib.hashProof(proof.a, proof.b, proof.c, proof.publicInputs);
        if (_usedProofs[proofHash]) revert ProofAlreadyUsed(proofHash);
        
        // Verify the ZK proof
        // In production, this would call an actual Groth16 verifier
        bool validProof = _verifyZKProof(proof, credentialHash);
        if (!validProof) revert InvalidProof();
        
        // Mark proof as used
        _usedProofs[proofHash] = true;
        
        // Update verification status
        VerificationStatus storage status = _verificationStatus[msg.sender];
        status.isVerified = true;
        status.verifiedAt = block.timestamp;
        status.expiresAt = credential.expiresAt;
        status.credentialHashes.push(credentialHash);
        
        // Update compliance registry
        _updateComplianceRegistry(msg.sender, status);
        
        emit VerificationCompleted(msg.sender, true, proofHash);
    }

    /**
     * @notice Verify a ZK proof without state changes
     */
    function verifyProof(ZKProof calldata proof, bytes32 credentialType) external pure returns (bool) {
        // Simplified verification - in production would use actual ZK verifier
        return _verifyZKProof(proof, credentialType);
    }

    /**
     * @notice Internal ZK proof verification
     * @dev In production, this would call a Groth16/PLONK verifier contract
     */
    function _verifyZKProof(ZKProof calldata proof, bytes32 /* credentialHash */) internal pure returns (bool) {
        // Simplified verification for hackathon
        // In production: call zkVerifierContract.verify(proof.a, proof.b, proof.c, proof.publicInputs)
        
        // Basic validation that proof has content
        if (proof.a[0] == 0 && proof.a[1] == 0) return false;
        if (proof.publicInputs.length == 0) return false;
        
        // For hackathon demo, accept valid-looking proofs
        // Real implementation would verify against the verification key
        return true;
    }

    // ============================================
    // CREDENTIAL MANAGEMENT
    // ============================================
    
    /**
     * @notice Issue a new credential
     */
    function issueCredential(
        address account,
        CredentialType credentialType,
        uint256 expiry,
        bytes32 merkleRoot
    ) external returns (bytes32 credentialHash) {
        if (account == address(0)) revert ZeroAddress();
        if (!_issuerAddresses.contains(msg.sender)) revert IssuerNotAuthorized(msg.sender);
        if (expiry <= block.timestamp) revert InvalidExpiry();
        
        // Check issuer is allowed to issue this type
        Issuer storage issuer = _issuers[msg.sender];
        bool canIssue = false;
        for (uint256 i = 0; i < issuer.allowedTypes.length;) {
            if (issuer.allowedTypes[i] == credentialType) {
                canIssue = true;
                break;
            }
            unchecked { ++i; }
        }
        if (!canIssue) revert IssuerNotAuthorized(msg.sender);
        
        // Generate credential hash
        credentialHash = ComplianceLib.hashCredential(
            account,
            msg.sender,
            uint8(credentialType),
            block.timestamp,
            merkleRoot
        );
        
        // Store credential
        _credentials[credentialHash] = Credential({
            credentialHash: credentialHash,
            issuer: msg.sender,
            issuedAt: block.timestamp,
            expiresAt: expiry,
            credentialType: credentialType,
            revoked: false,
            merkleRoot: merkleRoot
        });
        
        // Add to account's credentials
        _accountCredentials[account].add(credentialHash);
        
        emit CredentialIssued(account, credentialHash, expiry, credentialType);
    }

    /**
     * @notice Revoke a credential
     */
    function revokeCredential(bytes32 credentialHash, string calldata reason) external {
        Credential storage credential = _credentials[credentialHash];
        if (credential.credentialHash == bytes32(0)) revert InvalidProof();
        if (credential.issuer != msg.sender && msg.sender != owner()) {
            revert IssuerNotAuthorized(msg.sender);
        }
        
        credential.revoked = true;
        
        emit CredentialRevoked(credential.issuer, credentialHash, reason);
    }

    // ============================================
    // ACCREDITATION VERIFICATION
    // ============================================
    
    /**
     * @notice Verify accreditation with proof
     */
    function verifyAccreditation(ZKProof calldata proof, AccreditationType accreditationType) external {
        if (accreditationType == AccreditationType.NONE) revert InvalidCredentialType();
        
        // Verify proof
        bytes32 accreditationHash = keccak256(abi.encodePacked("ACCREDITATION", uint8(accreditationType)));
        bool validProof = _verifyZKProof(proof, accreditationHash);
        if (!validProof) revert InvalidProof();
        
        // Update verification status
        VerificationStatus storage status = _verificationStatus[msg.sender];
        status.accreditation = accreditationType;
        
        // Update compliance registry with accreditation
        _updateComplianceRegistry(msg.sender, status);
        
        emit AccreditationVerified(msg.sender, accreditationType);
    }

    // ============================================
    // SELECTIVE DISCLOSURE
    // ============================================
    
    /**
     * @notice Request selective disclosure of credential data
     */
    function requestDisclosure(address account, bytes32[] calldata fieldHashes) external {
        if (!_verificationStatus[account].isVerified) revert NotVerified(account);
        
        for (uint256 i = 0; i < fieldHashes.length;) {
            emit SelectiveDisclosure(account, fieldHashes[i], msg.sender);
            unchecked { ++i; }
        }
    }

    // ============================================
    // ISSUER MANAGEMENT
    // ============================================
    
    /**
     * @notice Add an authorized issuer
     */
    function addIssuer(
        address issuer,
        string calldata name,
        CredentialType[] calldata allowedTypes
    ) external onlyOwner {
        _addIssuer(issuer, name, allowedTypes);
    }

    function _addIssuer(
        address issuer,
        string memory name,
        CredentialType[] memory allowedTypes
    ) internal {
        if (issuer == address(0)) revert ZeroAddress();
        
        _issuers[issuer] = Issuer({
            issuerAddress: issuer,
            name: name,
            active: true,
            addedAt: block.timestamp,
            allowedTypes: allowedTypes
        });
        
        _issuerAddresses.add(issuer);
        
        emit IssuerAdded(issuer, name);
    }

    /**
     * @notice Remove an issuer
     */
    function removeIssuer(address issuer) external onlyOwner {
        _issuers[issuer].active = false;
        _issuerAddresses.remove(issuer);
        
        emit IssuerRemoved(issuer);
    }

    // ============================================
    // JURISDICTION MANAGEMENT
    // ============================================
    
    /**
     * @notice Block a jurisdiction
     */
    function blockJurisdiction(bytes32 jurisdictionCode) external onlyOwner {
        _blockedJurisdictions[jurisdictionCode] = true;
        emit JurisdictionBlocked(jurisdictionCode);
    }

    /**
     * @notice Unblock a jurisdiction
     */
    function unblockJurisdiction(bytes32 jurisdictionCode) external onlyOwner {
        _blockedJurisdictions[jurisdictionCode] = false;
    }

    /**
     * @notice Add a new jurisdiction
     */
    function addJurisdiction(bytes32 jurisdictionCode, string calldata name) external onlyOwner {
        emit JurisdictionAdded(jurisdictionCode, name);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    function isVerified(address account) external view returns (bool) {
        VerificationStatus storage status = _verificationStatus[account];
        if (!status.isVerified) return false;
        if (status.expiresAt > 0 && block.timestamp >= status.expiresAt) return false;
        return true;
    }

    function getVerificationStatus(address account) external view returns (VerificationStatus memory) {
        return _verificationStatus[account];
    }

    function getCredential(bytes32 credentialHash) external view returns (Credential memory) {
        return _credentials[credentialHash];
    }

    function isAuthorizedIssuer(address issuer) external view returns (bool) {
        return _issuerAddresses.contains(issuer) && _issuers[issuer].active;
    }

    function getCredentials(address account) external view returns (Credential[] memory) {
        EnumerableSet.Bytes32Set storage hashes = _accountCredentials[account];
        Credential[] memory credentials = new Credential[](hashes.length());
        
        for (uint256 i = 0; i < hashes.length();) {
            credentials[i] = _credentials[hashes.at(i)];
            unchecked { ++i; }
        }
        
        return credentials;
    }

    function getAccreditation(address account) external view returns (AccreditationType) {
        return _verificationStatus[account].accreditation;
    }

    function isJurisdictionAllowed(bytes32 jurisdictionCode) external view returns (bool) {
        return !_blockedJurisdictions[jurisdictionCode];
    }

    function batchVerify(address[] calldata accounts) external view returns (bool[] memory results) {
        results = new bool[](accounts.length);
        
        for (uint256 i = 0; i < accounts.length;) {
            VerificationStatus storage status = _verificationStatus[accounts[i]];
            results[i] = status.isVerified && 
                (status.expiresAt == 0 || block.timestamp < status.expiresAt);
            unchecked { ++i; }
        }
    }

    // ============================================
    // INTERNAL FUNCTIONS
    // ============================================
    
    function _updateComplianceRegistry(address account, VerificationStatus storage status) internal {
        if (address(complianceRegistry) == address(0)) return;
        
        // Determine compliance level based on credentials
        IComplianceRegistry.ComplianceLevel level = IComplianceRegistry.ComplianceLevel.BASIC;
        
        // Check credentials for higher levels
        EnumerableSet.Bytes32Set storage hashes = _accountCredentials[account];
        bool hasAML = false;
        
        for (uint256 i = 0; i < hashes.length();) {
            Credential storage cred = _credentials[hashes.at(i)];
            if (!cred.revoked && block.timestamp < cred.expiresAt) {
                if (cred.credentialType == CredentialType.AML) {
                    hasAML = true;
                }
            }
            unchecked { ++i; }
        }
        
        if (hasAML) {
            level = IComplianceRegistry.ComplianceLevel.STANDARD;
        }
        
        if (status.accreditation != AccreditationType.NONE) {
            level = IComplianceRegistry.ComplianceLevel.ENHANCED;
        }
        
        // Update registry
        complianceRegistry.updateComplianceStatus(
            account,
            true,
            level,
            status.expiresAt,
            keccak256(abi.encodePacked(status.credentialHashes))
        );
    }

    function _getAllCredentialTypes() internal pure returns (CredentialType[] memory) {
        CredentialType[] memory types = new CredentialType[](6);
        types[0] = CredentialType.IDENTITY;
        types[1] = CredentialType.ACCREDITATION;
        types[2] = CredentialType.JURISDICTION;
        types[3] = CredentialType.AML;
        types[4] = CredentialType.SANCTIONS;
        types[5] = CredentialType.TAX_RESIDENCY;
        return types;
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================
    
    function setComplianceRegistry(address _newRegistry) external onlyOwner {
        complianceRegistry = IComplianceRegistry(_newRegistry);
    }

    function setZKVerifierContract(address _verifier) external onlyOwner {
        zkVerifierContract = _verifier;
    }
}
