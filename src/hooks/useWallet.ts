import { useState, useEffect, useCallback } from "react";

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
}

interface UseWalletReturn extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToMantle: () => Promise<void>;
  isCorrectNetwork: boolean;
}

const MANTLE_TESTNET_CHAIN_ID = 5003;
const MANTLE_MAINNET_CHAIN_ID = 5000;

const MANTLE_NETWORKS = {
  testnet: {
    chainId: `0x${MANTLE_TESTNET_CHAIN_ID.toString(16)}`,
    chainName: "Mantle Sepolia Testnet",
    nativeCurrency: {
      name: "MNT",
      symbol: "MNT",
      decimals: 18,
    },
    rpcUrls: ["https://rpc.sepolia.mantle.xyz"],
    blockExplorerUrls: ["https://sepolia.mantlescan.xyz"],
  },
  mainnet: {
    chainId: `0x${MANTLE_MAINNET_CHAIN_ID.toString(16)}`,
    chainName: "Mantle",
    nativeCurrency: {
      name: "MNT",
      symbol: "MNT",
      decimals: 18,
    },
    rpcUrls: ["https://rpc.mantle.xyz"],
    blockExplorerUrls: ["https://mantlescan.xyz"],
  },
};

export function useWallet(): UseWalletReturn {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    isConnecting: false,
    error: null,
  });

  const isCorrectNetwork = state.chainId === MANTLE_TESTNET_CHAIN_ID || state.chainId === MANTLE_MAINNET_CHAIN_ID;

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;

      try {
        const accounts = (await window.ethereum.request({
          method: "eth_accounts",
        })) as string[];

        if (accounts.length > 0) {
          const chainId = (await window.ethereum.request({
            method: "eth_chainId",
          })) as string;

          setState({
            isConnected: true,
            address: accounts[0],
            chainId: parseInt(chainId, 16),
            isConnecting: false,
            error: null,
          });
        }
      } catch (error) {
        console.error("Failed to check connection:", error);
      }
    };

    checkConnection();
  }, []);

  // Listen for account and chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accountsArray = accounts as string[];
      if (accountsArray.length === 0) {
        setState((prev) => ({
          ...prev,
          isConnected: false,
          address: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isConnected: true,
          address: accountsArray[0],
        }));
      }
    };

    const handleChainChanged = (chainId: unknown) => {
      const chainIdStr = chainId as string;
      setState((prev) => ({
        ...prev,
        chainId: parseInt(chainIdStr, 16),
      }));
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setState((prev) => ({
        ...prev,
        error: "Please install MetaMask or another Web3 wallet",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      const chainId = (await window.ethereum.request({
        method: "eth_chainId",
      })) as string;

      setState({
        isConnected: true,
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        isConnecting: false,
        error: null,
      });
    } catch (error: unknown) {
      const err = error as { code?: number; message?: string };
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: err.message || "Failed to connect wallet",
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      address: null,
      chainId: null,
      isConnecting: false,
      error: null,
    });
  }, []);

  const switchToMantle = useCallback(async () => {
    if (!window.ethereum) return;

    const network = MANTLE_NETWORKS.testnet; // Default to testnet

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: network.chainId }],
      });
    } catch (error: unknown) {
      const err = error as { code?: number };
      // Chain not added, add it
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [network],
          });
        } catch (addError) {
          console.error("Failed to add Mantle network:", addError);
        }
      }
    }
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    switchToMantle,
    isCorrectNetwork,
  };
}
