const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting Meridian Protocol Deployment...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();
  
  console.log("📍 Network:", network.name);
  console.log("🔗 Chain ID:", network.chainId);
  console.log("👤 Deployer:", deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "MNT\n");

  const deployedContracts = {
    network: network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      MeridianToken: "",
      ComplianceRegistry: "",
      ZKKYCVerifier: "",
      MeridianVault: "",
      YieldAggregator: "",
    },
  };

  try {
    // ============================================
    // 1. Deploy Meridian Token (MRDL)
    // ============================================
    console.log("📝 Deploying MeridianToken...");
    const MeridianToken = await hre.ethers.getContractFactory("MeridianToken");
    const token = await MeridianToken.deploy(
      deployer.address, // treasury
      deployer.address  // initial owner
    );
    await token.waitForDeployment();
    deployedContracts.contracts.MeridianToken = await token.getAddress();
    console.log("✅ MeridianToken deployed to:", deployedContracts.contracts.MeridianToken);

    // ============================================
    // 2. Deploy Compliance Registry
    // ============================================
    console.log("\n📝 Deploying ComplianceRegistry...");
    const ComplianceRegistry = await hre.ethers.getContractFactory("ComplianceRegistry");
    const complianceRegistry = await ComplianceRegistry.deploy(
      hre.ethers.ZeroAddress // ZK Verifier will be set after deployment
    );
    await complianceRegistry.waitForDeployment();
    deployedContracts.contracts.ComplianceRegistry = await complianceRegistry.getAddress();
    console.log("✅ ComplianceRegistry deployed to:", deployedContracts.contracts.ComplianceRegistry);

    // ============================================
    // 3. Deploy ZK-KYC Verifier
    // ============================================
    console.log("\n📝 Deploying ZKKYCVerifier...");
    const ZKKYCVerifier = await hre.ethers.getContractFactory("ZKKYCVerifier");
    const zkVerifier = await ZKKYCVerifier.deploy(
      deployedContracts.contracts.ComplianceRegistry
    );
    await zkVerifier.waitForDeployment();
    deployedContracts.contracts.ZKKYCVerifier = await zkVerifier.getAddress();
    console.log("✅ ZKKYCVerifier deployed to:", deployedContracts.contracts.ZKKYCVerifier);

    // Update Compliance Registry with ZK Verifier address
    console.log("\n🔗 Linking ComplianceRegistry to ZKKYCVerifier...");
    await complianceRegistry.setZKKYCVerifier(deployedContracts.contracts.ZKKYCVerifier);
    console.log("✅ ComplianceRegistry linked to ZKKYCVerifier");

    // ============================================
    // 4. Deploy Meridian Vault (USDC-based example)
    // ============================================
    console.log("\n📝 Deploying MeridianVault...");
    
    // For demo, we'll use the MRDL token as the base asset
    // In production, this would be USDC/USDT
    const MeridianVault = await hre.ethers.getContractFactory("MeridianVault");
    const vault = await MeridianVault.deploy(
      deployedContracts.contracts.MeridianToken, // asset (using MRDL for demo)
      "Meridian US Treasury Vault",
      "mUSTB",
      {
        depositLimit: hre.ethers.parseEther("10000000"), // 10M limit
        withdrawLockPeriod: 86400, // 1 day
        performanceFee: 1000, // 10%
        managementFee: 200, // 2%
        feeRecipient: deployer.address,
        complianceRegistry: deployedContracts.contracts.ComplianceRegistry,
        priceOracle: hre.ethers.ZeroAddress, // Would be Pyth in production
        requiresCompliance: true,
      }
    );
    await vault.waitForDeployment();
    deployedContracts.contracts.MeridianVault = await vault.getAddress();
    console.log("✅ MeridianVault deployed to:", deployedContracts.contracts.MeridianVault);

    // Register vault with compliance registry
    console.log("\n🔗 Registering vault with ComplianceRegistry...");
    await complianceRegistry.registerVault(
      deployedContracts.contracts.MeridianVault,
      1, // ComplianceLevel.BASIC
      false, // doesn't require accreditation
      [] // all jurisdictions allowed
    );
    console.log("✅ Vault registered with ComplianceRegistry");

    // ============================================
    // 5. Deploy Yield Aggregator
    // ============================================
    console.log("\n📝 Deploying YieldAggregator...");
    const YieldAggregator = await hre.ethers.getContractFactory("YieldAggregator");
    const aggregator = await YieldAggregator.deploy(
      deployedContracts.contracts.MeridianToken, // base asset
      {
        performanceFee: 500, // 5%
        rebalanceThreshold: 500, // 5% deviation triggers rebalance
        minRebalanceInterval: 3600, // 1 hour minimum
        maxStrategies: 10,
        feeRecipient: deployer.address,
        autoCompound: true,
      }
    );
    await aggregator.waitForDeployment();
    deployedContracts.contracts.YieldAggregator = await aggregator.getAddress();
    console.log("✅ YieldAggregator deployed to:", deployedContracts.contracts.YieldAggregator);

    // Add vault as a strategy
    console.log("\n🔗 Adding MeridianVault as strategy to YieldAggregator...");
    await aggregator.addStrategy(
      deployedContracts.contracts.MeridianVault,
      10000, // 100% allocation to this vault for now
      "US Treasury Vault",
      25 // Risk score 25/100
    );
    console.log("✅ Strategy added to YieldAggregator");

    // ============================================
    // 6. Initial Token Distribution
    // ============================================
    console.log("\n📝 Executing initial token distribution...");
    
    // Distribution: Treasury (30%), Liquidity (15%), Team (20%), Community (25%), Partners (10%)
    const treasuryAmount = hre.ethers.parseEther("30000000");
    const liquidityAmount = hre.ethers.parseEther("15000000");
    const teamAmount = hre.ethers.parseEther("20000000");
    const communityAmount = hre.ethers.parseEther("25000000");
    const partnersAmount = hre.ethers.parseEther("10000000");
    
    await token.initialDistribution(
      [
        deployer.address, // Treasury
        deployer.address, // Liquidity (would be DEX in production)
        deployer.address, // Team
        deployer.address, // Community
        deployer.address, // Partners
      ],
      [
        treasuryAmount,
        liquidityAmount,
        teamAmount,
        communityAmount,
        partnersAmount,
      ]
    );
    console.log("✅ Initial distribution complete");

    // ============================================
    // Save Deployment Info
    // ============================================
    const deploymentPath = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentPath)) {
      fs.mkdirSync(deploymentPath, { recursive: true });
    }

    const fileName = `${network.name !== "unknown" ? network.name : "mantle-testnet"}-${Date.now()}.json`;
    fs.writeFileSync(
      path.join(deploymentPath, fileName),
      JSON.stringify(deployedContracts, null, 2)
    );

    // Also save as latest
    const latestName = network.name !== "unknown" ? network.name : "mantle-testnet";
    fs.writeFileSync(
      path.join(deploymentPath, `${latestName}-latest.json`),
      JSON.stringify(deployedContracts, null, 2)
    );

    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log("\n📋 Contract Addresses:");
    console.log("  MeridianToken:      ", deployedContracts.contracts.MeridianToken);
    console.log("  ComplianceRegistry: ", deployedContracts.contracts.ComplianceRegistry);
    console.log("  ZKKYCVerifier:      ", deployedContracts.contracts.ZKKYCVerifier);
    console.log("  MeridianVault:      ", deployedContracts.contracts.MeridianVault);
    console.log("  YieldAggregator:    ", deployedContracts.contracts.YieldAggregator);
    console.log("\n📁 Deployment saved to:", path.join(deploymentPath, fileName));
    console.log("\n🔧 Next Steps:");
    console.log("  1. Verify contracts on Mantlescan");
    console.log("  2. Update frontend .env with contract addresses");
    console.log("  3. Configure price oracle");
    console.log("  4. Add additional KYC issuers");

    // Print .env format for easy copy
    console.log("\n📋 Copy these to your .env file:");
    console.log("VITE_MERIDIAN_TOKEN_ADDRESS=" + deployedContracts.contracts.MeridianToken);
    console.log("VITE_MERIDIAN_VAULT_ADDRESS=" + deployedContracts.contracts.MeridianVault);
    console.log("VITE_YIELD_AGGREGATOR_ADDRESS=" + deployedContracts.contracts.YieldAggregator);
    console.log("VITE_ZKKYC_VERIFIER_ADDRESS=" + deployedContracts.contracts.ZKKYCVerifier);
    console.log("VITE_COMPLIANCE_REGISTRY_ADDRESS=" + deployedContracts.contracts.ComplianceRegistry);

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
