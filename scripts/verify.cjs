const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Starting Contract Verification on Mantlescan...\n");

  const network = await hre.ethers.provider.getNetwork();
  console.log("📍 Network:", network.name);
  console.log("🔗 Chain ID:", network.chainId);

  // Read deployment file
  const deploymentPath = path.join(__dirname, "../deployments");
  const latestFile = path.join(deploymentPath, "mantleTestnet-latest.json");

  if (!fs.existsSync(latestFile)) {
    console.error("❌ No deployment file found. Run deploy.cjs first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(latestFile, "utf8"));
  console.log("\n📋 Verifying contracts from deployment:", deployment.timestamp);

  const [deployer] = await hre.ethers.getSigners();

  try {
    // 1. Verify MeridianToken
    console.log("\n📝 Verifying MeridianToken...");
    try {
      await hre.run("verify:verify", {
        address: deployment.contracts.MeridianToken,
        constructorArguments: [deployer.address, deployer.address],
      });
      console.log("✅ MeridianToken verified");
    } catch (e) {
      if (e.message.includes("Already Verified")) {
        console.log("⚠️ MeridianToken already verified");
      } else {
        console.log("⚠️ MeridianToken verification failed:", e.message);
      }
    }

    // 2. Verify ComplianceRegistry
    console.log("\n📝 Verifying ComplianceRegistry...");
    try {
      await hre.run("verify:verify", {
        address: deployment.contracts.ComplianceRegistry,
        constructorArguments: [hre.ethers.ZeroAddress],
      });
      console.log("✅ ComplianceRegistry verified");
    } catch (e) {
      if (e.message.includes("Already Verified")) {
        console.log("⚠️ ComplianceRegistry already verified");
      } else {
        console.log("⚠️ ComplianceRegistry verification failed:", e.message);
      }
    }

    // 3. Verify ZKKYCVerifier
    console.log("\n📝 Verifying ZKKYCVerifier...");
    try {
      await hre.run("verify:verify", {
        address: deployment.contracts.ZKKYCVerifier,
        constructorArguments: [deployment.contracts.ComplianceRegistry],
      });
      console.log("✅ ZKKYCVerifier verified");
    } catch (e) {
      if (e.message.includes("Already Verified")) {
        console.log("⚠️ ZKKYCVerifier already verified");
      } else {
        console.log("⚠️ ZKKYCVerifier verification failed:", e.message);
      }
    }

    // 4. Verify MeridianVault
    console.log("\n📝 Verifying MeridianVault...");
    try {
      await hre.run("verify:verify", {
        address: deployment.contracts.MeridianVault,
        constructorArguments: [
          deployment.contracts.MeridianToken,
          "Meridian US Treasury Vault",
          "mUSTB",
          {
            depositLimit: hre.ethers.parseEther("10000000"),
            withdrawLockPeriod: 86400,
            performanceFee: 1000,
            managementFee: 200,
            feeRecipient: deployer.address,
            complianceRegistry: deployment.contracts.ComplianceRegistry,
            priceOracle: hre.ethers.ZeroAddress,
            requiresCompliance: true,
          },
        ],
      });
      console.log("✅ MeridianVault verified");
    } catch (e) {
      if (e.message.includes("Already Verified")) {
        console.log("⚠️ MeridianVault already verified");
      } else {
        console.log("⚠️ MeridianVault verification failed:", e.message);
      }
    }

    // 5. Verify YieldAggregator
    console.log("\n📝 Verifying YieldAggregator...");
    try {
      await hre.run("verify:verify", {
        address: deployment.contracts.YieldAggregator,
        constructorArguments: [
          deployment.contracts.MeridianToken,
          {
            performanceFee: 500,
            rebalanceThreshold: 500,
            minRebalanceInterval: 3600,
            maxStrategies: 10,
            feeRecipient: deployer.address,
            autoCompound: true,
          },
        ],
      });
      console.log("✅ YieldAggregator verified");
    } catch (e) {
      if (e.message.includes("Already Verified")) {
        console.log("⚠️ YieldAggregator already verified");
      } else {
        console.log("⚠️ YieldAggregator verification failed:", e.message);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 VERIFICATION COMPLETE!");
    console.log("=".repeat(60));
    console.log("\n🔗 View on Mantlescan:");
    console.log(`  MeridianToken:       https://sepolia.mantlescan.xyz/address/${deployment.contracts.MeridianToken}`);
    console.log(`  ComplianceRegistry:  https://sepolia.mantlescan.xyz/address/${deployment.contracts.ComplianceRegistry}`);
    console.log(`  ZKKYCVerifier:       https://sepolia.mantlescan.xyz/address/${deployment.contracts.ZKKYCVerifier}`);
    console.log(`  MeridianVault:       https://sepolia.mantlescan.xyz/address/${deployment.contracts.MeridianVault}`);
    console.log(`  YieldAggregator:     https://sepolia.mantlescan.xyz/address/${deployment.contracts.YieldAggregator}`);

  } catch (error) {
    console.error("\n❌ Verification failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
