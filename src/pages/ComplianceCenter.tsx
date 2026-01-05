import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { KYCVerificationWizard } from "@/components/KYCVerificationWizard";
import { useWallet } from "@/hooks/useWalletConnect";
import { useComplianceStatus, useKYCStatus } from "@/hooks/useContracts";
import { useProfile, useKYCDocuments } from "@/hooks/useSupabase";
import { type Address } from 'viem';
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Globe,
  FileText,
  Key,
  RefreshCw,
  ChevronRight,
  User,
  Building,
  MapPin,
  Calendar,
  Fingerprint,
  ShieldCheck,
  Wallet,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const disclosureSettings = [
  {
    id: "age",
    label: "Age Verification",
    description: "Prove you are over 18 without revealing exact age",
    enabled: true,
    required: true,
  },
  {
    id: "jurisdiction",
    label: "Jurisdiction",
    description: "Share country of residence for regulatory compliance",
    enabled: true,
    required: true,
  },
  {
    id: "accreditation",
    label: "Accreditation Status",
    description: "Prove accredited investor status for access to private offerings",
    enabled: true,
    required: false,
  },
  {
    id: "taxId",
    label: "Tax Identification",
    description: "Required for tax reporting in certain jurisdictions",
    enabled: false,
    required: false,
  },
  {
    id: "sourceOfFunds",
    label: "Source of Funds",
    description: "AML verification for high-value transactions",
    enabled: false,
    required: false,
  },
];

const complianceDocuments = [
  {
    name: "KYC Verification",
    status: "verified",
    date: "Dec 15, 2024",
    icon: User,
  },
  {
    name: "Accreditation Letter",
    status: "verified",
    date: "Dec 10, 2024",
    icon: Building,
  },
  {
    name: "Address Verification",
    status: "verified",
    date: "Dec 15, 2024",
    icon: MapPin,
  },
  {
    name: "Tax Documentation",
    status: "pending",
    date: "Awaiting",
    icon: FileText,
  },
];

const jurisdictions = [
  { code: "US", name: "United States", status: "full", assets: 45 },
  { code: "UK", name: "United Kingdom", status: "full", assets: 38 },
  { code: "EU", name: "European Union", status: "full", assets: 42 },
  { code: "SG", name: "Singapore", status: "partial", assets: 28 },
  { code: "JP", name: "Japan", status: "partial", assets: 22 },
  { code: "HK", name: "Hong Kong", status: "partial", assets: 25 },
];

export function ComplianceCenter() {
  const [settings, setSettings] = useState(disclosureSettings);
  const [showProofDetails, setShowProofDetails] = useState(false);
  const [kycWizardOpen, setKycWizardOpen] = useState(false);

  // Real wallet and contract data
  const { isConnected, address, connect, shortAddress } = useWallet();
  const { isCompliant, refetch: refetchCompliance } = useComplianceStatus(address as Address);
  const { isVerified, accreditationType, refetch: refetchKYC } = useKYCStatus(address as Address);

  // Supabase data
  const { profile, createProfile, updateProfile } = useProfile(address);
  const { documents, submitDocument, isLoading: docsLoading, refetch: refetchDocs } = useKYCDocuments(address);

  // Merge on-chain and off-chain document status
  const mergedDocuments = useMemo(() => {
    const baseDocuments = [...complianceDocuments];
    
    // Update status from Supabase if available
    if (documents.length > 0) {
      return baseDocuments.map(doc => {
        const supabaseDoc = documents.find(d => 
          d.document_type === doc.name.toLowerCase().replace(' ', '_').replace(' verification', '').replace(' letter', '')
        );
        if (supabaseDoc) {
          return {
            ...doc,
            status: supabaseDoc.status === 'approved' ? 'verified' : supabaseDoc.status,
            date: supabaseDoc.status === 'approved' && supabaseDoc.reviewed_at 
              ? new Date(supabaseDoc.reviewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : supabaseDoc.status === 'pending' ? 'Under Review' : doc.date,
          };
        }
        return doc;
      });
    }
    
    return baseDocuments;
  }, [documents]);

  // Create profile if doesn't exist
  useEffect(() => {
    if (address && !profile && isConnected) {
      createProfile(address);
    }
  }, [address, profile, isConnected, createProfile]);

  const toggleSetting = (id: string) => {
    setSettings((prev) =>
      prev.map((s) =>
        s.id === id && !s.required ? { ...s, enabled: !s.enabled } : s
      )
    );
  };

  const handleRefresh = () => {
    refetchCompliance();
    refetchKYC();
    refetchDocs();
  };

  const handleUploadDocument = async (docType: 'identity' | 'address' | 'accreditation' | 'tax') => {
    // In production, this would open a file picker and upload to storage
    // For now, we'll simulate adding a pending document
    await submitDocument({
      document_type: docType,
      document_name: `${docType}_document_${Date.now()}.pdf`,
      file_url: null, // Would be storage URL in production
    });
  };

  // Not connected view
  if (!isConnected) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex min-h-[60vh] items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Connect to View Compliance Status
            </h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to check your KYC status and manage compliance settings.
            </p>
            <Button variant="hero" size="lg" onClick={connect} className="gap-2">
              <Wallet className="h-5 w-5" />
              Connect Wallet
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* KYC Verification Wizard */}
      <KYCVerificationWizard
        open={kycWizardOpen}
        onOpenChange={setKycWizardOpen}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gain/20">
              <Shield className="h-7 w-7 text-gain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Compliance Center
              </h1>
              <p className="text-muted-foreground">
                ZK-powered identity verification with selective disclosure
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
              Refresh Status
            </Button>
            <Button 
              variant="hero" 
              size="sm" 
              className="gap-2"
              disabled={!isVerified}
            >
              <FileText className="h-4 w-4" />
              Export Proof
            </Button>
          </div>
        </div>

        {/* KYC Status Card */}
        <Card variant="elevated" className="overflow-hidden">
          <div className="grid lg:grid-cols-2">
            {/* Status */}
            <div className="p-6">
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className={cn(
                    "flex h-20 w-20 items-center justify-center rounded-2xl",
                    isVerified ? "bg-gain/20" : "bg-warning/20"
                  )}
                >
                  {isVerified ? (
                    <ShieldCheck className="h-10 w-10 text-gain" />
                  ) : (
                    <AlertTriangle className="h-10 w-10 text-warning" />
                  )}
                </motion.div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-foreground">
                      {isVerified ? "Identity Verified" : "Not Verified"}
                    </h2>
                    {isVerified ? (
                      <Badge variant="gain">ZK-Verified</Badge>
                    ) : (
                      <Badge variant="destructive">Pending</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {isVerified 
                      ? "Your identity is verified using zero-knowledge proofs"
                      : "Complete KYC verification to access all features"}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-secondary/30 p-4">
                  <p className="text-xs text-muted-foreground">Verification Level</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {accreditationType === 1 ? "Accredited Investor" : 
                     accreditationType === 2 ? "Qualified Purchaser" :
                     accreditationType === 3 ? "Institutional" :
                     isVerified ? "Retail Verified" : "Unverified"}
                  </p>
                </div>
                <div className="rounded-xl bg-secondary/30 p-4">
                  <p className="text-xs text-muted-foreground">Compliance Status</p>
                  <p className={cn(
                    "mt-1 font-semibold",
                    isCompliant ? "text-gain" : "text-warning"
                  )}>
                    {isCompliant ? "Compliant" : "Not Compliant"}
                  </p>
                </div>
                <div className="rounded-xl bg-secondary/30 p-4">
                  <p className="text-xs text-muted-foreground">Wallet Address</p>
                  <p className="mt-1 font-semibold text-foreground truncate text-xs">
                    {address?.slice(0, 10)}...{address?.slice(-8)}
                  </p>
                </div>
                <div className="rounded-xl bg-secondary/30 p-4">
                  <p className="text-xs text-muted-foreground">Network</p>
                  <p className="mt-1 font-semibold text-foreground">
                    Mantle Sepolia
                  </p>
                </div>
              </div>

              {/* Start Verification Button for non-verified users */}
              {!isVerified && (
                <div className="mt-6">
                  <Button 
                    variant="hero" 
                    className="w-full gap-2"
                    onClick={() => setKycWizardOpen(true)}
                  >
                    <Shield className="h-4 w-4" />
                    Start KYC Verification
                  </Button>
                </div>
              )}
            </div>

            {/* ZK Proof */}
            <div className="border-t border-border/50 bg-secondary/20 p-6 lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">ZK Proof</h3>
                </div>
                {isVerified && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowProofDetails(!showProofDetails)}
                  >
                    {showProofDetails ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Show
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="mt-4 rounded-xl border border-border/50 bg-background/50 p-4 font-mono text-xs">
                {!isVerified ? (
                  <div className="text-center text-muted-foreground py-4">
                    <Lock className="mx-auto h-8 w-8 opacity-50" />
                    <p className="mt-2">Complete KYC verification to generate ZK proof</p>
                  </div>
                ) : showProofDetails ? (
                  <div className="space-y-2">
                    <div>
                      <span className="text-muted-foreground">wallet: </span>
                      <span className="text-foreground">{address}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">circuit: </span>
                      <span className="text-foreground">meridian-kyc-v1.circom</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">verifier: </span>
                      <span className="text-foreground">0x9dfF21EAC0dc1D3C2a08Dc9168119fA8F2F3b56c</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">registry: </span>
                      <span className="text-foreground">0xe05626781cF3B9a477FDE0f2Ae02129F22779209</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">onChain: </span>
                      <span className="text-gain">✓ Verified</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Lock className="mx-auto h-8 w-8 opacity-50" />
                    <p className="mt-2">Click "Show" to reveal proof details</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 gap-2"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Status
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 gap-2"
                  onClick={() => window.open(`https://sepolia.mantlescan.xyz/address/${address}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                  View on Explorer
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Selective Disclosure */}
          <div className="lg:col-span-2">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Selective Disclosure Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-6 text-sm text-muted-foreground">
                  Choose what information to share with protocols. ZK proofs allow
                  you to prove claims without revealing underlying data.
                </p>
                <div className="space-y-4">
                  {settings.map((setting, i) => (
                    <motion.div
                      key={setting.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-between rounded-xl border border-border/50 bg-secondary/20 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg",
                            setting.enabled ? "bg-gain/20" : "bg-secondary"
                          )}
                        >
                          {setting.enabled ? (
                            <Eye className="h-4 w-4 text-gain" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">
                              {setting.label}
                            </p>
                            {setting.required && (
                              <Badge variant="outline" className="text-[10px]">
                                Required
                              </Badge>
                            )}
                          </div>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {setting.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={setting.enabled}
                        onCheckedChange={() => toggleSetting(setting.id)}
                        disabled={setting.required}
                      />
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Documents & Jurisdiction */}
          <div className="space-y-6">
            {/* Documents */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-base">Compliance Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mergedDocuments.map((doc, i) => (
                    <motion.div
                      key={doc.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 rounded-lg bg-secondary/20 p-3"
                    >
                      <doc.icon className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {doc.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{doc.date}</p>
                      </div>
                      {doc.status === "verified" ? (
                        <CheckCircle2 className="h-5 w-5 text-gain" />
                      ) : doc.status === "pending" ? (
                        <RefreshCw className="h-5 w-5 text-yellow-500 animate-spin" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-yield" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Jurisdictions */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-base">Supported Jurisdictions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {jurisdictions.map((j, i) => (
                    <motion.div
                      key={j.code}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between rounded-lg bg-secondary/20 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getFlagEmoji(j.code)}</span>
                        <span className="text-sm font-medium">{j.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {j.assets} assets
                        </span>
                        <Badge
                          variant={j.status === "full" ? "gain" : "yield"}
                          className="text-[10px]"
                        >
                          {j.status}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Compliance Score */}
        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="flex items-center gap-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                  <AnimatedNumber
                    value={96}
                    suffix="%"
                    className="text-3xl font-bold text-primary"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    Compliance Score
                  </h3>
                  <p className="text-muted-foreground">
                    Complete tax documentation to reach 100%
                  </p>
                </div>
              </div>
              <Button variant="hero" className="gap-2">
                Complete Verification
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Helper function for flag emojis
function getFlagEmoji(countryCode: string): string {
  const flags: Record<string, string> = {
    US: "🇺🇸",
    UK: "🇬🇧",
    EU: "🇪🇺",
    SG: "🇸🇬",
    JP: "🇯🇵",
    HK: "🇭🇰",
  };
  return flags[countryCode] || "🏳️";
}
