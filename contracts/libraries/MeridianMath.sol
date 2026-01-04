// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MeridianMath
 * @notice Math utilities for Meridian protocol
 * @dev Fixed-point arithmetic and financial calculations
 */
library MeridianMath {
    /// @notice Basis points denominator (100% = 10000)
    uint256 internal constant BPS = 10000;
    
    /// @notice Precision for fixed-point calculations
    uint256 internal constant PRECISION = 1e18;
    
    /// @notice Seconds per year for APY calculations
    uint256 internal constant SECONDS_PER_YEAR = 365.25 days;
    
    /// @notice Maximum basis points (100%)
    uint256 internal constant MAX_BPS = 10000;

    // ============================================
    // ERRORS
    // ============================================
    
    error DivisionByZero();
    error Overflow();
    error InvalidBasisPoints();

    // ============================================
    // BASIS POINTS OPERATIONS
    // ============================================
    
    /**
     * @notice Calculate percentage of value in basis points
     * @param value The base value
     * @param bps Basis points (100 = 1%)
     * @return result The calculated percentage
     */
    function bpsOf(uint256 value, uint256 bps) internal pure returns (uint256 result) {
        if (bps > MAX_BPS) revert InvalidBasisPoints();
        result = (value * bps) / BPS;
    }

    /**
     * @notice Calculate what percentage one value is of another in basis points
     * @param numerator The part
     * @param denominator The whole
     * @return bps The percentage in basis points
     */
    function toBps(uint256 numerator, uint256 denominator) internal pure returns (uint256 bps) {
        if (denominator == 0) revert DivisionByZero();
        bps = (numerator * BPS) / denominator;
    }

    // ============================================
    // FIXED-POINT OPERATIONS
    // ============================================
    
    /**
     * @notice Multiply two fixed-point numbers
     * @param a First operand (1e18 precision)
     * @param b Second operand (1e18 precision)
     * @return result Product (1e18 precision)
     */
    function mulFixed(uint256 a, uint256 b) internal pure returns (uint256 result) {
        result = (a * b) / PRECISION;
    }

    /**
     * @notice Divide two fixed-point numbers
     * @param a Numerator (1e18 precision)
     * @param b Denominator (1e18 precision)
     * @return result Quotient (1e18 precision)
     */
    function divFixed(uint256 a, uint256 b) internal pure returns (uint256 result) {
        if (b == 0) revert DivisionByZero();
        result = (a * PRECISION) / b;
    }

    // ============================================
    // YIELD CALCULATIONS
    // ============================================
    
    /**
     * @notice Calculate APY from APR with continuous compounding
     * @param apr Annual percentage rate in basis points
     * @return apy Annual percentage yield in basis points
     * @dev Uses approximation: APY ≈ APR + (APR²/2) for small APR
     */
    function aprToApy(uint256 apr) internal pure returns (uint256 apy) {
        // For small APR, APY ≈ APR + APR²/(2*BPS)
        uint256 aprSquared = (apr * apr) / BPS;
        apy = apr + (aprSquared / 2);
    }

    /**
     * @notice Calculate yield for a period
     * @param principal The principal amount
     * @param apyBps APY in basis points
     * @param duration Duration in seconds
     * @return yield The yield amount
     */
    function calculateYield(
        uint256 principal,
        uint256 apyBps,
        uint256 duration
    ) internal pure returns (uint256 yield) {
        // yield = principal * apy * duration / (BPS * SECONDS_PER_YEAR)
        yield = (principal * apyBps * duration) / (BPS * SECONDS_PER_YEAR);
    }

    /**
     * @notice Calculate compounded value
     * @param principal Initial amount
     * @param ratePerPeriodBps Rate per period in basis points
     * @param periods Number of compounding periods
     * @return finalValue The compounded value
     */
    function compound(
        uint256 principal,
        uint256 ratePerPeriodBps,
        uint256 periods
    ) internal pure returns (uint256 finalValue) {
        finalValue = principal;
        for (uint256 i = 0; i < periods;) {
            finalValue = finalValue + bpsOf(finalValue, ratePerPeriodBps);
            unchecked { ++i; }
        }
    }

    // ============================================
    // SHARE CALCULATIONS (ERC-4626)
    // ============================================
    
    /**
     * @notice Convert assets to shares
     * @param assets Amount of assets
     * @param totalAssets Total assets in vault
     * @param totalShares Total shares minted
     * @return shares Amount of shares
     */
    function assetsToShares(
        uint256 assets,
        uint256 totalAssets,
        uint256 totalShares
    ) internal pure returns (uint256 shares) {
        if (totalAssets == 0 || totalShares == 0) {
            shares = assets;
        } else {
            shares = (assets * totalShares) / totalAssets;
        }
    }

    /**
     * @notice Convert shares to assets
     * @param shares Amount of shares
     * @param totalAssets Total assets in vault
     * @param totalShares Total shares minted
     * @return assets Amount of assets
     */
    function sharesToAssets(
        uint256 shares,
        uint256 totalAssets,
        uint256 totalShares
    ) internal pure returns (uint256 assets) {
        if (totalShares == 0) {
            assets = shares;
        } else {
            assets = (shares * totalAssets) / totalShares;
        }
    }

    // ============================================
    // RISK CALCULATIONS
    // ============================================
    
    /**
     * @notice Calculate weighted average
     * @param values Array of values
     * @param weights Array of weights (must sum to BPS)
     * @return weightedAvg The weighted average
     */
    function weightedAverage(
        uint256[] memory values,
        uint256[] memory weights
    ) internal pure returns (uint256 weightedAvg) {
        require(values.length == weights.length, "Length mismatch");
        
        uint256 totalWeight;
        for (uint256 i = 0; i < values.length;) {
            weightedAvg += values[i] * weights[i];
            totalWeight += weights[i];
            unchecked { ++i; }
        }
        
        if (totalWeight > 0) {
            weightedAvg = weightedAvg / totalWeight;
        }
    }

    /**
     * @notice Calculate standard deviation (simplified)
     * @param values Array of values
     * @param mean The mean value
     * @return stdDev The standard deviation
     */
    function standardDeviation(
        uint256[] memory values,
        uint256 mean
    ) internal pure returns (uint256 stdDev) {
        if (values.length == 0) return 0;
        
        uint256 sumSquaredDiff;
        for (uint256 i = 0; i < values.length;) {
            uint256 diff = values[i] > mean ? values[i] - mean : mean - values[i];
            sumSquaredDiff += diff * diff;
            unchecked { ++i; }
        }
        
        // Return approximate std dev (sqrt approximation)
        stdDev = sqrt(sumSquaredDiff / values.length);
    }

    /**
     * @notice Calculate square root using Babylonian method
     * @param x The input value
     * @return y The square root
     */
    function sqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;
        
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    /**
     * @notice Return the minimum of two values
     */
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    /**
     * @notice Return the maximum of two values
     */
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a : b;
    }

    /**
     * @notice Clamp value between min and max
     */
    function clamp(uint256 value, uint256 minVal, uint256 maxVal) internal pure returns (uint256) {
        return min(max(value, minVal), maxVal);
    }

    /**
     * @notice Calculate absolute difference
     */
    function absDiff(uint256 a, uint256 b) internal pure returns (uint256) {
        return a > b ? a - b : b - a;
    }
}
