import { useState, useEffect, useCallback } from "react";
import { BrowserProvider, Contract } from "ethers";
import { ABIS, getContractAddress } from "@/lib/contracts";
import { useWallet } from "./useWallet";

interface ComplianceStatus {
  isVerified: boolean;
  isCompliantForVault: boolean;
  accreditationType: number;
  canInteract: boolean;
}

interface UseComplianceReturn {
  status: ComplianceStatus | null;
  isLoading: boolean;
  error: string | null;
  checkCompliance: (vaultAddress?: string) => Promise<void>;
}

export function useCompliance(): UseComplianceReturn {
  const { address, isConnected, isCorrectNetwork } = useWallet();
  const [status, setStatus] = useState<ComplianceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProvider = useCallback(() => {
    if (!window.ethereum) throw new Error("No wallet found");
    return new BrowserProvider(window.ethereum);
  }, []);

  const checkCompliance = useCallback(async (vaultAddress?: string) => {
    if (!isConnected || !isCorrectNetwork || !address) return;

    setIsLoading(true);
    setError(null);

    try {
      const provider = getProvider();
      
      const zkVerifierAddress = getContractAddress("ZKKYCVerifier");
      const registryAddress = getContractAddress("ComplianceRegistry");
      const vault = vaultAddress || getContractAddress("MeridianVault");

      if (!zkVerifierAddress || !registryAddress) {
        throw new Error("Compliance contracts not deployed");
      }

      const zkVerifier = new Contract(zkVerifierAddress, ABIS.ZKKYCVerifier, provider);
      const registry = new Contract(registryAddress, ABIS.ComplianceRegistry, provider);

      const [isVerified, accreditationType, canInteract] = await Promise.all([
        zkVerifier.isVerified(address),
        zkVerifier.getAccreditation(address),
        vault ? registry.canInteract(address, vault) : Promise.resolve(false),
      ]);

      setStatus({
        isVerified,
        isCompliantForVault: canInteract,
        accreditationType: Number(accreditationType),
        canInteract,
      });
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Failed to check compliance:", error);
      setError(error.message || "Failed to check compliance");
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected, isCorrectNetwork, getProvider]);

  useEffect(() => {
    checkCompliance();
  }, [checkCompliance]);

  return {
    status,
    isLoading,
    error,
    checkCompliance,
  };
}

// Accreditation type names
export const ACCREDITATION_TYPES = {
  0: "None",
  1: "Qualified Purchaser",
  2: "Accredited Investor",
  3: "Institutional",
  4: "Professional",
} as const;

// Helper to get accreditation name
export function getAccreditationName(type: number): string {
  return ACCREDITATION_TYPES[type as keyof typeof ACCREDITATION_TYPES] || "Unknown";
}
