// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

/**
 * @title MeridianToken
 * @notice MRDL - Governance token for Meridian Protocol
 * @dev ERC20 with voting, burning, and permit functionality
 * 
 * Token Distribution:
 * - Total Supply: 100,000,000 MRDL
 * - Protocol Treasury: 30%
 * - Community Incentives: 25%
 * - Team & Advisors: 20% (4-year vesting)
 * - Liquidity Mining: 15%
 * - Strategic Partners: 10%
 */
contract MeridianToken is ERC20, ERC20Burnable, ERC20Permit, ERC20Votes, Ownable {
    // ============================================
    // CONSTANTS
    // ============================================
    
    /// @notice Total supply cap: 100 million tokens
    uint256 public constant MAX_SUPPLY = 100_000_000 * 1e18;
    
    /// @notice Minimum time between mints
    uint256 public constant MIN_MINT_INTERVAL = 365 days;
    
    /// @notice Maximum mint per interval (2% of max supply)
    uint256 public constant MAX_MINT_AMOUNT = MAX_SUPPLY * 2 / 100;

    // ============================================
    // STATE
    // ============================================
    
    /// @notice Timestamp of last mint
    uint256 public lastMintTime;
    
    /// @notice Protocol treasury address
    address public treasury;
    
    /// @notice Whether initial distribution is complete
    bool public initialDistributionComplete;

    // ============================================
    // EVENTS
    // ============================================
    
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event InitialDistributionComplete(uint256 timestamp);
    event EmergencyMint(address indexed to, uint256 amount, string reason);

    // ============================================
    // ERRORS
    // ============================================
    
    error MintTooSoon(uint256 nextMintTime);
    error MintAmountTooLarge(uint256 requested, uint256 max);
    error SupplyCapExceeded(uint256 requested, uint256 remaining);
    error InitialDistributionAlreadyComplete();
    error ZeroAddress();

    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    constructor(
        address _treasury,
        address _initialOwner
    ) 
        ERC20("Meridian", "MRDL") 
        ERC20Permit("Meridian")
        Ownable(_initialOwner)
    {
        if (_treasury == address(0)) revert ZeroAddress();
        if (_initialOwner == address(0)) revert ZeroAddress();
        
        treasury = _treasury;
        lastMintTime = block.timestamp;
    }

    // ============================================
    // INITIAL DISTRIBUTION
    // ============================================
    
    /**
     * @notice Execute initial token distribution
     * @param recipients Array of recipient addresses
     * @param amounts Array of token amounts
     * @dev Can only be called once by owner
     */
    function initialDistribution(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOwner {
        if (initialDistributionComplete) revert InitialDistributionAlreadyComplete();
        require(recipients.length == amounts.length, "Length mismatch");
        
        uint256 totalAmount;
        for (uint256 i = 0; i < recipients.length;) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            totalAmount += amounts[i];
            unchecked { ++i; }
        }
        
        if (totalSupply() + totalAmount > MAX_SUPPLY) {
            revert SupplyCapExceeded(totalAmount, MAX_SUPPLY - totalSupply());
        }
        
        for (uint256 i = 0; i < recipients.length;) {
            _mint(recipients[i], amounts[i]);
            unchecked { ++i; }
        }
        
        initialDistributionComplete = true;
        emit InitialDistributionComplete(block.timestamp);
    }

    // ============================================
    // CONTROLLED MINTING
    // ============================================
    
    /**
     * @notice Mint new tokens (controlled, time-limited)
     * @param to Recipient address
     * @param amount Amount to mint
     * @dev Limited to MAX_MINT_AMOUNT per MIN_MINT_INTERVAL
     */
    function mint(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        
        uint256 nextMintTime = lastMintTime + MIN_MINT_INTERVAL;
        if (block.timestamp < nextMintTime) {
            revert MintTooSoon(nextMintTime);
        }
        
        if (amount > MAX_MINT_AMOUNT) {
            revert MintAmountTooLarge(amount, MAX_MINT_AMOUNT);
        }
        
        if (totalSupply() + amount > MAX_SUPPLY) {
            revert SupplyCapExceeded(amount, MAX_SUPPLY - totalSupply());
        }
        
        lastMintTime = block.timestamp;
        _mint(to, amount);
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================
    
    /**
     * @notice Update treasury address
     * @param newTreasury New treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();
        
        address oldTreasury = treasury;
        treasury = newTreasury;
        
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    /**
     * @notice Get remaining mintable supply
     */
    function remainingMintableSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }

    /**
     * @notice Get time until next mint is allowed
     */
    function timeUntilNextMint() external view returns (uint256) {
        uint256 nextMintTime = lastMintTime + MIN_MINT_INTERVAL;
        if (block.timestamp >= nextMintTime) {
            return 0;
        }
        return nextMintTime - block.timestamp;
    }

    // ============================================
    // REQUIRED OVERRIDES
    // ============================================
    
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(
        address owner
    ) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
