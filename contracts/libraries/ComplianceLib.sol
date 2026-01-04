// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ComplianceLib
 * @notice Library for compliance-related utilities
 * @dev Helpers for ZK proofs, credential hashing, and jurisdiction checks
 */
library ComplianceLib {
    // ============================================
    // CONSTANTS
    // ============================================
    
    /// @notice Domain separator for credential hashing
    bytes32 internal constant CREDENTIAL_DOMAIN = keccak256("MERIDIAN_CREDENTIAL_V1");
    
    /// @notice Domain separator for proof hashing
    bytes32 internal constant PROOF_DOMAIN = keccak256("MERIDIAN_ZKPROOF_V1");

    // Common jurisdiction codes (ISO 3166-1 alpha-2 as bytes32)
    bytes32 internal constant JURISDICTION_US = keccak256("US");
    bytes32 internal constant JURISDICTION_EU = keccak256("EU");
    bytes32 internal constant JURISDICTION_UK = keccak256("UK");
    bytes32 internal constant JURISDICTION_SG = keccak256("SG");
    bytes32 internal constant JURISDICTION_HK = keccak256("HK");
    bytes32 internal constant JURISDICTION_CH = keccak256("CH");
    bytes32 internal constant JURISDICTION_AE = keccak256("AE");
    bytes32 internal constant JURISDICTION_JP = keccak256("JP");

    // ============================================
    // CREDENTIAL HASHING
    // ============================================
    
    /**
     * @notice Generate credential hash
     * @param account The account address
     * @param issuer The issuer address
     * @param credentialType The type of credential
     * @param issuedAt Issuance timestamp
     * @param merkleRoot Merkle root of credential data
     * @return hash The credential hash
     */
    function hashCredential(
        address account,
        address issuer,
        uint8 credentialType,
        uint256 issuedAt,
        bytes32 merkleRoot
    ) internal pure returns (bytes32 hash) {
        hash = keccak256(abi.encodePacked(
            CREDENTIAL_DOMAIN,
            account,
            issuer,
            credentialType,
            issuedAt,
            merkleRoot
        ));
    }

    /**
     * @notice Hash ZK proof for uniqueness check
     * @param a Proof component a
     * @param b Proof component b
     * @param c Proof component c
     * @param publicInputs Public inputs array
     * @return hash The proof hash
     */
    function hashProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[] memory publicInputs
    ) internal pure returns (bytes32 hash) {
        hash = keccak256(abi.encodePacked(
            PROOF_DOMAIN,
            a[0], a[1],
            b[0][0], b[0][1], b[1][0], b[1][1],
            c[0], c[1],
            publicInputs
        ));
    }

    // ============================================
    // MERKLE VERIFICATION
    // ============================================
    
    /**
     * @notice Verify a Merkle proof
     * @param leaf The leaf node hash
     * @param proof The Merkle proof
     * @param root The Merkle root
     * @return valid Whether the proof is valid
     */
    function verifyMerkleProof(
        bytes32 leaf,
        bytes32[] memory proof,
        bytes32 root
    ) internal pure returns (bool valid) {
        bytes32 computedHash = leaf;
        
        for (uint256 i = 0; i < proof.length;) {
            bytes32 proofElement = proof[i];
            
            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
            
            unchecked { ++i; }
        }
        
        valid = computedHash == root;
    }

    /**
     * @notice Compute leaf hash for Merkle tree
     * @param key The field key
     * @param value The field value
     * @return leaf The leaf hash
     */
    function computeLeaf(
        bytes32 key,
        bytes32 value
    ) internal pure returns (bytes32 leaf) {
        leaf = keccak256(abi.encodePacked(key, value));
    }

    // ============================================
    // JURISDICTION UTILITIES
    // ============================================
    
    /**
     * @notice Convert country code string to bytes32
     * @param code The ISO country code (e.g., "US")
     * @return jurisdictionCode The bytes32 representation
     */
    function encodeJurisdiction(string memory code) internal pure returns (bytes32 jurisdictionCode) {
        jurisdictionCode = keccak256(bytes(code));
    }

    /**
     * @notice Check if jurisdiction is in allowed list
     * @param jurisdiction The jurisdiction to check
     * @param allowedList Array of allowed jurisdictions
     * @return allowed Whether the jurisdiction is allowed
     */
    function isJurisdictionAllowed(
        bytes32 jurisdiction,
        bytes32[] memory allowedList
    ) internal pure returns (bool allowed) {
        // Empty list means all jurisdictions allowed
        if (allowedList.length == 0) return true;
        
        for (uint256 i = 0; i < allowedList.length;) {
            if (allowedList[i] == jurisdiction) {
                return true;
            }
            unchecked { ++i; }
        }
        
        return false;
    }

    /**
     * @notice Get common allowed jurisdictions for RWA
     * @return jurisdictions Array of allowed jurisdiction codes
     */
    function getDefaultAllowedJurisdictions() internal pure returns (bytes32[] memory jurisdictions) {
        jurisdictions = new bytes32[](8);
        jurisdictions[0] = JURISDICTION_US;
        jurisdictions[1] = JURISDICTION_EU;
        jurisdictions[2] = JURISDICTION_UK;
        jurisdictions[3] = JURISDICTION_SG;
        jurisdictions[4] = JURISDICTION_HK;
        jurisdictions[5] = JURISDICTION_CH;
        jurisdictions[6] = JURISDICTION_AE;
        jurisdictions[7] = JURISDICTION_JP;
    }

    // ============================================
    // ACCREDITATION UTILITIES
    // ============================================
    
    /**
     * @notice Check if accreditation level meets requirement
     * @param actual The actual accreditation level (0-4)
     * @param required The required accreditation level (0-4)
     * @return meets Whether actual meets or exceeds required
     */
    function meetsAccreditationRequirement(
        uint8 actual,
        uint8 required
    ) internal pure returns (bool meets) {
        // NONE(0) < QUALIFIED_PURCHASER(1) < ACCREDITED(2) < INSTITUTIONAL(3) < PROFESSIONAL(4)
        // Actually: higher levels include lower levels' permissions
        meets = actual >= required;
    }

    // ============================================
    // SELECTIVE DISCLOSURE
    // ============================================
    
    /**
     * @notice Create selective disclosure proof hash
     * @param account The account disclosing
     * @param fieldHashes Array of field hashes being disclosed
     * @param timestamp Disclosure timestamp
     * @return disclosureHash Hash of the disclosure
     */
    function hashDisclosure(
        address account,
        bytes32[] memory fieldHashes,
        uint256 timestamp
    ) internal pure returns (bytes32 disclosureHash) {
        disclosureHash = keccak256(abi.encodePacked(
            "MERIDIAN_DISCLOSURE_V1",
            account,
            fieldHashes,
            timestamp
        ));
    }

    // ============================================
    // EXPIRY UTILITIES
    // ============================================
    
    /**
     * @notice Check if credential is expired
     * @param expiryTimestamp The expiry timestamp
     * @return expired Whether the credential is expired
     */
    function isExpired(uint256 expiryTimestamp) internal view returns (bool expired) {
        expired = block.timestamp >= expiryTimestamp;
    }

    /**
     * @notice Calculate expiry timestamp from duration
     * @param duration Duration in seconds
     * @return expiry The expiry timestamp
     */
    function calculateExpiry(uint256 duration) internal view returns (uint256 expiry) {
        expiry = block.timestamp + duration;
    }

    /**
     * @notice Get time until expiry
     * @param expiryTimestamp The expiry timestamp
     * @return remaining Seconds until expiry (0 if expired)
     */
    function timeUntilExpiry(uint256 expiryTimestamp) internal view returns (uint256 remaining) {
        if (block.timestamp >= expiryTimestamp) {
            remaining = 0;
        } else {
            remaining = expiryTimestamp - block.timestamp;
        }
    }
}
