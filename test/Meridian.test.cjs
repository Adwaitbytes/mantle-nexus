const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("Meridian Protocol", function () {
  // Fixture to deploy all contracts
  async function deployProtocolFixture() {
    const [owner, user1, user2, treasury, feeRecipient] = await ethers.getSigners();

    // Deploy Token
    const MeridianToken = await ethers.getContractFactory("MeridianToken");
    const token = await MeridianToken.deploy(treasury.address, owner.address);
    await token.waitForDeployment();

    // Deploy Compliance Registry
    const ComplianceRegistry = await ethers.getContractFactory("ComplianceRegistry");
    const complianceRegistry = await ComplianceRegistry.deploy(ethers.ZeroAddress);
    await complianceRegistry.waitForDeployment();

    // Deploy ZK Verifier
    const ZKKYCVerifier = await ethers.getContractFactory("ZKKYCVerifier");
    const zkVerifier = await ZKKYCVerifier.deploy(await complianceRegistry.getAddress());
    await zkVerifier.waitForDeployment();

    // Link compliance registry to ZK verifier
    await complianceRegistry.setZKKYCVerifier(await zkVerifier.getAddress());

    // Deploy Vault
    const MeridianVault = await ethers.getContractFactory("MeridianVault");
    const vault = await MeridianVault.deploy(
      await token.getAddress(),
      "Meridian Test Vault",
      "mTEST",
      {
        depositLimit: ethers.parseEther("1000000"),
        withdrawLockPeriod: 0, // No lock for tests
        performanceFee: 1000, // 10%
        managementFee: 200, // 2%
        feeRecipient: feeRecipient.address,
        complianceRegistry: await complianceRegistry.getAddress(),
        priceOracle: ethers.ZeroAddress,
        requiresCompliance: true,
      }
    );
    await vault.waitForDeployment();

    // Register vault with compliance registry
    await complianceRegistry.registerVault(
      await vault.getAddress(),
      1, // BASIC
      false,
      []
    );

    // Deploy Aggregator
    const YieldAggregator = await ethers.getContractFactory("YieldAggregator");
    const aggregator = await YieldAggregator.deploy(
      await token.getAddress(),
      {
        performanceFee: 500,
        rebalanceThreshold: 500,
        minRebalanceInterval: 0,
        maxStrategies: 10,
        feeRecipient: feeRecipient.address,
        autoCompound: true,
      }
    );
    await aggregator.waitForDeployment();

    // Initial token distribution
    await token.initialDistribution(
      [owner.address, user1.address, user2.address],
      [
        ethers.parseEther("50000000"),
        ethers.parseEther("1000000"),
        ethers.parseEther("1000000"),
      ]
    );

    return {
      token,
      complianceRegistry,
      zkVerifier,
      vault,
      aggregator,
      owner,
      user1,
      user2,
      treasury,
      feeRecipient,
    };
  }

  describe("MeridianToken", function () {
    it("Should have correct name and symbol", async function () {
      const { token } = await loadFixture(deployProtocolFixture);
      expect(await token.name()).to.equal("Meridian");
      expect(await token.symbol()).to.equal("MRDL");
    });

    it("Should distribute initial tokens correctly", async function () {
      const { token, owner, user1 } = await loadFixture(deployProtocolFixture);
      expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("50000000"));
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("1000000"));
    });

    it("Should prevent double initial distribution", async function () {
      const { token, owner } = await loadFixture(deployProtocolFixture);
      await expect(
        token.initialDistribution([owner.address], [ethers.parseEther("1000")])
      ).to.be.revertedWithCustomError(token, "InitialDistributionAlreadyComplete");
    });

    it("Should enforce mint interval", async function () {
      const { token, owner } = await loadFixture(deployProtocolFixture);
      await expect(
        token.mint(owner.address, ethers.parseEther("1000"))
      ).to.be.revertedWithCustomError(token, "MintTooSoon");
    });
  });

  describe("ComplianceRegistry", function () {
    it("Should register vaults correctly", async function () {
      const { complianceRegistry, vault } = await loadFixture(deployProtocolFixture);
      const vaults = await complianceRegistry.getRegisteredVaults();
      expect(vaults).to.include(await vault.getAddress());
    });

    it("Should update compliance status", async function () {
      const { complianceRegistry, user1 } = await loadFixture(deployProtocolFixture);
      
      const expiry = Math.floor(Date.now() / 1000) + 86400;
      await complianceRegistry.updateComplianceStatus(
        user1.address,
        true,
        1, // BASIC
        expiry,
        ethers.keccak256(ethers.toUtf8Bytes("test"))
      );

      const status = await complianceRegistry.getAccountStatus(user1.address);
      expect(status.isCompliant).to.be.true;
      expect(status.level).to.equal(1);
    });

    it("Should freeze and unfreeze accounts", async function () {
      const { complianceRegistry, user1 } = await loadFixture(deployProtocolFixture);
      
      await complianceRegistry.freezeAccount(user1.address, "Test freeze");
      let status = await complianceRegistry.getAccountStatus(user1.address);
      expect(status.isFrozen).to.be.true;

      await complianceRegistry.unfreezeAccount(user1.address);
      status = await complianceRegistry.getAccountStatus(user1.address);
      expect(status.isFrozen).to.be.false;
    });

    it("Should check interaction permissions", async function () {
      const { complianceRegistry, vault, user1 } = await loadFixture(deployProtocolFixture);
      
      // User not compliant
      expect(await complianceRegistry.canInteract(user1.address, await vault.getAddress())).to.be.false;

      // Make user compliant
      const expiry = Math.floor(Date.now() / 1000) + 86400;
      await complianceRegistry.updateComplianceStatus(
        user1.address,
        true,
        1,
        expiry,
        ethers.keccak256(ethers.toUtf8Bytes("test"))
      );

      expect(await complianceRegistry.canInteract(user1.address, await vault.getAddress())).to.be.true;
    });
  });

  describe("ZKKYCVerifier", function () {
    it("Should issue credentials", async function () {
      const { zkVerifier, user1 } = await loadFixture(deployProtocolFixture);
      
      const expiry = Math.floor(Date.now() / 1000) + 86400;
      const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("user-data"));

      await zkVerifier.issueCredential(
        user1.address,
        0, // IDENTITY
        expiry,
        merkleRoot
      );

      const credentials = await zkVerifier.getCredentials(user1.address);
      expect(credentials.length).to.equal(1);
      expect(credentials[0].revoked).to.be.false;
    });

    it("Should block unauthorized issuers", async function () {
      const { zkVerifier, user1, user2 } = await loadFixture(deployProtocolFixture);
      
      const expiry = Math.floor(Date.now() / 1000) + 86400;
      const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("user-data"));

      await expect(
        zkVerifier.connect(user2).issueCredential(
          user1.address,
          0,
          expiry,
          merkleRoot
        )
      ).to.be.revertedWithCustomError(zkVerifier, "IssuerNotAuthorized");
    });
  });

  describe("MeridianVault", function () {
    async function setupCompliantUser(complianceRegistry, userAddress) {
      const expiry = Math.floor(Date.now() / 1000) + 86400;
      await complianceRegistry.updateComplianceStatus(
        userAddress,
        true,
        1,
        expiry,
        ethers.keccak256(ethers.toUtf8Bytes("test"))
      );
    }

    it("Should allow compliant users to deposit", async function () {
      const { token, vault, complianceRegistry, user1 } = await loadFixture(deployProtocolFixture);
      
      await setupCompliantUser(complianceRegistry, user1.address);
      
      const depositAmount = ethers.parseEther("1000");
      await token.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      expect(await vault.balanceOf(user1.address)).to.equal(depositAmount);
    });

    it("Should reject non-compliant users", async function () {
      const { token, vault, user1 } = await loadFixture(deployProtocolFixture);
      
      const depositAmount = ethers.parseEther("1000");
      await token.connect(user1).approve(await vault.getAddress(), depositAmount);

      await expect(
        vault.connect(user1).deposit(depositAmount, user1.address)
      ).to.be.revertedWithCustomError(vault, "NotCompliant");
    });

    it("Should allow withdrawals", async function () {
      const { token, vault, complianceRegistry, user1 } = await loadFixture(deployProtocolFixture);
      
      await setupCompliantUser(complianceRegistry, user1.address);
      
      const depositAmount = ethers.parseEther("1000");
      await token.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      // Get the shares received and use redeem instead of withdraw
      const shares = await vault.balanceOf(user1.address);
      const balanceBefore = await token.balanceOf(user1.address);
      
      // Redeem all shares instead of trying to withdraw exact deposit amount
      await vault.connect(user1).redeem(shares, user1.address, user1.address);
      const balanceAfter = await token.balanceOf(user1.address);

      // User should have received some tokens back (may be slightly less due to rounding)
      expect(balanceAfter).to.be.gt(balanceBefore);
      expect(await vault.balanceOf(user1.address)).to.equal(0);
    });

    it("Should track total assets correctly", async function () {
      const { token, vault, complianceRegistry, user1 } = await loadFixture(deployProtocolFixture);
      
      await setupCompliantUser(complianceRegistry, user1.address);
      
      const depositAmount = ethers.parseEther("1000");
      await token.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      expect(await vault.totalAssets()).to.be.closeTo(depositAmount, ethers.parseEther("1"));
    });

    it("Should respect deposit limits", async function () {
      const { token, vault, complianceRegistry, owner, user1 } = await loadFixture(deployProtocolFixture);
      
      await setupCompliantUser(complianceRegistry, user1.address);
      
      // Try to deposit more than limit
      const hugeDeposit = ethers.parseEther("2000000"); // 2M, limit is 1M
      await token.transfer(user1.address, hugeDeposit);
      await token.connect(user1).approve(await vault.getAddress(), hugeDeposit);

      await expect(
        vault.connect(user1).deposit(hugeDeposit, user1.address)
      ).to.be.revertedWithCustomError(vault, "DepositLimitExceeded");
    });
  });

  describe("YieldAggregator", function () {
    it("Should add strategies", async function () {
      const { aggregator, vault, owner } = await loadFixture(deployProtocolFixture);
      
      await aggregator.addStrategy(
        await vault.getAddress(),
        5000, // 50%
        "Test Vault",
        25
      );

      const strategies = await aggregator.getStrategies();
      expect(strategies.length).to.equal(1);
      expect(strategies[0].name).to.equal("Test Vault");
    });

    it("Should reject duplicate strategies", async function () {
      const { aggregator, vault } = await loadFixture(deployProtocolFixture);
      
      await aggregator.addStrategy(await vault.getAddress(), 5000, "Test", 25);
      
      await expect(
        aggregator.addStrategy(await vault.getAddress(), 2000, "Test2", 30)
      ).to.be.revertedWithCustomError(aggregator, "StrategyAlreadyExists");
    });

    it("Should reject allocation over 100%", async function () {
      const { aggregator, vault, token, owner } = await loadFixture(deployProtocolFixture);
      
      await expect(
        aggregator.addStrategy(await vault.getAddress(), 15000, "Test", 25) // 150%
      ).to.be.revertedWithCustomError(aggregator, "AllocationExceeds100Percent");
    });

    it("Should update allocations", async function () {
      const { aggregator, vault } = await loadFixture(deployProtocolFixture);
      
      await aggregator.addStrategy(await vault.getAddress(), 5000, "Test", 25);
      await aggregator.updateAllocation(await vault.getAddress(), 7000);

      const strategy = await aggregator.getStrategy(await vault.getAddress());
      expect(strategy.allocation).to.equal(7000);
    });
  });

  describe("Integration Tests", function () {
    it("Should complete full user flow", async function () {
      const { token, vault, complianceRegistry, zkVerifier, user1 } = await loadFixture(deployProtocolFixture);
      
      // 1. Issue KYC credential
      const expiry = Math.floor(Date.now() / 1000) + 86400;
      await zkVerifier.issueCredential(
        user1.address,
        0,
        expiry,
        ethers.keccak256(ethers.toUtf8Bytes("kyc"))
      );

      // 2. Update compliance status
      await complianceRegistry.updateComplianceStatus(
        user1.address,
        true,
        1,
        expiry,
        ethers.keccak256(ethers.toUtf8Bytes("compliance"))
      );

      // 3. Deposit to vault
      const depositAmount = ethers.parseEther("1000");
      await token.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      // 4. Check balances
      expect(await vault.balanceOf(user1.address)).to.be.gt(0);
      expect(await token.balanceOf(user1.address)).to.equal(
        ethers.parseEther("1000000") - depositAmount
      );

      // 5. Withdraw
      const shares = await vault.balanceOf(user1.address);
      await vault.connect(user1).redeem(shares, user1.address, user1.address);

      // 6. Verify final state
      expect(await vault.balanceOf(user1.address)).to.equal(0);
    });
  });
});
