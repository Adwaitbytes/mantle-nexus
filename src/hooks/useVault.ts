import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, Contract, formatEther, parseEther, formatUnits } from "ethers";
import { ABIS, getContractAddress, getNetworkConfig } from "@/lib/contracts";
import { useWallet } from "./useWallet";

interface VaultData {
  name: string;
  symbol: string;
  totalAssets: string;
  totalSupply: string;
  userShares: string;
  userAssets: string;
  apy: string;
  isCompliant: boolean;
  availableLiquidity: string;
}

interface UseVaultReturn {
  vaultData: VaultData | null;
  isLoading: boolean;
  error: string | null;
  deposit: (amount: string) => Promise<string | null>;
  withdraw: (amount: string) => Promise<string | null>;
  approve: (amount: string) => Promise<string | null>;
  refetch: () => Promise<void>;
}

export function useVault(): UseVaultReturn {
  const { address, isConnected, isCorrectNetwork } = useWallet();
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProvider = useCallback(() => {
    if (!window.ethereum) throw new Error("No wallet found");
    return new BrowserProvider(window.ethereum);
  }, []);

  const getVaultContract = useCallback(async (withSigner = false) => {
    const provider = getProvider();
    const vaultAddress = getContractAddress("MeridianVault");
    
    if (!vaultAddress) throw new Error("Vault not deployed");
    
    if (withSigner) {
      const signer = await provider.getSigner();
      return new Contract(vaultAddress, ABIS.MeridianVault, signer);
    }
    
    return new Contract(vaultAddress, ABIS.MeridianVault, provider);
  }, [getProvider]);

  const getTokenContract = useCallback(async (withSigner = false) => {
    const provider = getProvider();
    const tokenAddress = getContractAddress("MeridianToken");
    
    if (!tokenAddress) throw new Error("Token not deployed");
    
    if (withSigner) {
      const signer = await provider.getSigner();
      return new Contract(tokenAddress, ABIS.MeridianToken, signer);
    }
    
    return new Contract(tokenAddress, ABIS.MeridianToken, provider);
  }, [getProvider]);

  const fetchVaultData = useCallback(async () => {
    if (!isConnected || !isCorrectNetwork || !address) return;

    setIsLoading(true);
    setError(null);

    try {
      const vault = await getVaultContract();
      
      const [
        name,
        symbol,
        totalAssets,
        totalSupply,
        userShares,
        apy,
        isCompliant,
        availableLiquidity,
      ] = await Promise.all([
        vault.name(),
        vault.symbol(),
        vault.totalAssets(),
        vault.totalSupply(),
        vault.balanceOf(address),
        vault.currentAPY(),
        vault.isCompliant(address),
        vault.availableLiquidity(),
      ]);

      // Convert shares to assets
      const userAssets = totalSupply > 0n
        ? (userShares * totalAssets) / totalSupply
        : 0n;

      setVaultData({
        name,
        symbol,
        totalAssets: formatEther(totalAssets),
        totalSupply: formatEther(totalSupply),
        userShares: formatEther(userShares),
        userAssets: formatEther(userAssets),
        apy: (Number(apy) / 100).toFixed(2), // Convert from basis points
        isCompliant,
        availableLiquidity: formatEther(availableLiquidity),
      });
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Failed to fetch vault data:", error);
      setError(error.message || "Failed to fetch vault data");
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected, isCorrectNetwork, getVaultContract]);

  useEffect(() => {
    fetchVaultData();
  }, [fetchVaultData]);

  const approve = useCallback(async (amount: string): Promise<string | null> => {
    try {
      const token = await getTokenContract(true);
      const vaultAddress = getContractAddress("MeridianVault");
      
      const tx = await token.approve(vaultAddress, parseEther(amount));
      const receipt = await tx.wait();
      
      return receipt.hash;
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Approval failed:", error);
      setError(error.message || "Approval failed");
      return null;
    }
  }, [getTokenContract]);

  const deposit = useCallback(async (amount: string): Promise<string | null> => {
    if (!address) return null;

    try {
      const vault = await getVaultContract(true);
      
      const tx = await vault.deposit(parseEther(amount), address);
      const receipt = await tx.wait();
      
      await fetchVaultData();
      return receipt.hash;
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Deposit failed:", error);
      setError(error.message || "Deposit failed");
      return null;
    }
  }, [address, getVaultContract, fetchVaultData]);

  const withdraw = useCallback(async (amount: string): Promise<string | null> => {
    if (!address) return null;

    try {
      const vault = await getVaultContract(true);
      
      const tx = await vault.withdraw(parseEther(amount), address, address);
      const receipt = await tx.wait();
      
      await fetchVaultData();
      return receipt.hash;
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Withdraw failed:", error);
      setError(error.message || "Withdraw failed");
      return null;
    }
  }, [address, getVaultContract, fetchVaultData]);

  return {
    vaultData,
    isLoading,
    error,
    deposit,
    withdraw,
    approve,
    refetch: fetchVaultData,
  };
}
