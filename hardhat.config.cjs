require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000001";
const MANTLE_TESTNET_RPC = process.env.MANTLE_TESTNET_RPC || "https://rpc.sepolia.mantle.xyz";
const MANTLE_MAINNET_RPC = process.env.MANTLE_MAINNET_RPC || "https://rpc.mantle.xyz";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
      evmVersion: "paris",
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    mantleTestnet: {
      url: MANTLE_TESTNET_RPC,
      chainId: 5003,
      accounts: [`0x${PRIVATE_KEY}`],
      gasPrice: 1000000000,
    },
    mantleMainnet: {
      url: MANTLE_MAINNET_RPC,
      chainId: 5000,
      accounts: [`0x${PRIVATE_KEY}`],
      gasPrice: 1000000000,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
    customChains: [
      {
        network: "mantleTestnet",
        chainId: 5003,
        urls: {
          apiURL: "https://api-sepolia.mantlescan.xyz/api",
          browserURL: "https://sepolia.mantlescan.xyz",
        },
      },
      {
        network: "mantleMainnet",
        chainId: 5000,
        urls: {
          apiURL: "https://api.mantlescan.xyz/api",
          browserURL: "https://mantlescan.xyz",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};
