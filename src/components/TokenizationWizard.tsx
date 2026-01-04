import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Building2,
  FileText,
  Coins,
  Shield,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  AlertTriangle,
  Loader2,
  Sparkles,
  Landmark,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TokenizationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const assetTypes = [
  {
    id: "real-estate",
    name: "Real Estate",
    icon: Building2,
    description: "Commercial or residential properties",
    examples: ["Office buildings", "Apartments", "Industrial"],
  },
  {
    id: "fixed-income",
    name: "Fixed Income",
    icon: Landmark,
    description: "Bonds and debt instruments",
    examples: ["Treasury bonds", "Corporate bonds", "Notes"],
  },
  {
    id: "receivables",
    name: "Trade Receivables",
    icon: FileText,
    description: "Invoice and accounts receivable",
    examples: ["Invoice factoring", "Supply chain finance"],
  },
  {
    id: "commodities",
    name: "Commodities",
    icon: Coins,
    description: "Physical commodities and derivatives",
    examples: ["Precious metals", "Agriculture", "Energy"],
  },
  {
    id: "environmental",
    name: "Environmental",
    icon: Leaf,
    description: "Carbon credits and sustainability assets",
    examples: ["Carbon offsets", "RECs", "Green bonds"],
  },
];

const steps = [
  { id: 1, name: "Asset Type", description: "Select the asset category" },
  { id: 2, name: "Details", description: "Provide asset information" },
  { id: 3, name: "Compliance", description: "Configure regulatory settings" },
  { id: 4, name: "Review", description: "Confirm and deploy" },
];

export function TokenizationWizard({ open, onOpenChange }: TokenizationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployComplete, setDeployComplete] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    description: "",
    totalSupply: "",
    minInvestment: "",
    targetApy: "",
    jurisdiction: "US",
    complianceLevel: "accredited",
  });

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDeploy();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    // Simulate deployment
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsDeploying(false);
    setDeployComplete(true);
  };

  const handleClose = () => {
    setCurrentStep(1);
    setSelectedType(null);
    setDeployComplete(false);
    setFormData({
      name: "",
      symbol: "",
      description: "",
      totalSupply: "",
      minInvestment: "",
      targetApy: "",
      jurisdiction: "US",
      complianceLevel: "accredited",
    });
    onOpenChange(false);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedType !== null;
      case 2:
        return formData.name && formData.symbol && formData.totalSupply;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        {deployComplete ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gain/20"
            >
              <CheckCircle2 className="h-10 w-10 text-gain" />
            </motion.div>
            <h2 className="mt-6 text-2xl font-bold text-foreground">
              Asset Tokenized Successfully!
            </h2>
            <p className="mt-2 text-muted-foreground">
              Your RWA token has been deployed to Mantle Network
            </p>
            <div className="mt-6 rounded-xl bg-secondary/30 p-4 font-mono text-sm">
              <p className="text-muted-foreground">Contract Address</p>
              <p className="text-foreground">0x7a2F8c3E91b6D4aC7892e41Bc53a4b8c9f2e1d3c</p>
            </div>
            <div className="mt-6 flex gap-3 justify-center">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button variant="hero" className="gap-2">
                View on Explorer
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Header */}
            <DialogHeader className="p-6 pb-0">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-gold">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Tokenize New Asset</DialogTitle>
                  <DialogDescription>
                    Create a compliant RWA token on Mantle Network
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Progress Steps */}
            <div className="px-6 py-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                {steps.map((step, i) => (
                  <div key={step.id} className="flex items-center">
                    <div className="flex items-center">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                          currentStep >= step.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                        )}
                      >
                        {currentStep > step.id ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          step.id
                        )}
                      </div>
                      <div className="ml-3 hidden sm:block">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            currentStep >= step.id
                              ? "text-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {step.name}
                        </p>
                      </div>
                    </div>
                    {i < steps.length - 1 && (
                      <div
                        className={cn(
                          "mx-4 h-px w-8 sm:w-16",
                          currentStep > step.id ? "bg-primary" : "bg-border"
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="p-6 min-h-[300px]">
              <AnimatePresence mode="wait">
                {/* Step 1: Asset Type */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <h3 className="font-semibold text-foreground">
                      Select Asset Type
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {assetTypes.map((type) => (
                        <Card
                          key={type.id}
                          variant={selectedType === type.id ? "glow" : "default"}
                          className={cn(
                            "cursor-pointer transition-all",
                            selectedType === type.id && "ring-2 ring-primary"
                          )}
                          onClick={() => setSelectedType(type.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <type.icon className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-medium text-foreground">
                                  {type.name}
                                </h4>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {type.description}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Details */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <h3 className="font-semibold text-foreground">
                      Asset Details
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Asset Name</Label>
                        <Input
                          id="name"
                          placeholder="e.g., Prime Office REIT"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="symbol">Token Symbol</Label>
                        <Input
                          id="symbol"
                          placeholder="e.g., PREIT"
                          value={formData.symbol}
                          onChange={(e) =>
                            setFormData({ ...formData, symbol: e.target.value.toUpperCase() })
                          }
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          placeholder="Brief description of the asset..."
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="totalSupply">Total Supply (Tokens)</Label>
                        <Input
                          id="totalSupply"
                          type="number"
                          placeholder="e.g., 1000000"
                          value={formData.totalSupply}
                          onChange={(e) =>
                            setFormData({ ...formData, totalSupply: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="minInvestment">Min Investment ($)</Label>
                        <Input
                          id="minInvestment"
                          type="number"
                          placeholder="e.g., 1000"
                          value={formData.minInvestment}
                          onChange={(e) =>
                            setFormData({ ...formData, minInvestment: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="targetApy">Target APY (%)</Label>
                        <Input
                          id="targetApy"
                          type="number"
                          placeholder="e.g., 8.5"
                          value={formData.targetApy}
                          onChange={(e) =>
                            setFormData({ ...formData, targetApy: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Compliance */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <h3 className="font-semibold text-foreground">
                      Compliance Configuration
                    </h3>
                    <div className="space-y-4">
                      <Card variant="glass">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium text-foreground">
                                SEC Regulation D (506c)
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Accredited investors only, no general solicitation limits
                              </p>
                            </div>
                            <Badge variant="gain" className="ml-auto">
                              Enabled
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                      <Card variant="glass">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium text-foreground">
                                ZK-KYC Verification
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Privacy-preserving identity verification required
                              </p>
                            </div>
                            <Badge variant="gain" className="ml-auto">
                              Enabled
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                      <Card variant="glass">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium text-foreground">
                                Transfer Restrictions
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Whitelist-only transfers between verified investors
                              </p>
                            </div>
                            <Badge variant="gain" className="ml-auto">
                              Enabled
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                      <div className="rounded-xl bg-yield/10 border border-yield/30 p-4">
                        <div className="flex gap-3">
                          <AlertTriangle className="h-5 w-5 text-yield shrink-0" />
                          <div>
                            <p className="font-medium text-foreground">
                              Compliance Review Required
                            </p>
                            <p className="text-sm text-muted-foreground">
                              This token will be reviewed by our compliance team before going live.
                              Estimated review time: 24-48 hours.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Review */}
                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <h3 className="font-semibold text-foreground">
                      Review & Deploy
                    </h3>
                    <Card variant="glass">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Asset Type</span>
                          <span className="font-medium">
                            {assetTypes.find((t) => t.id === selectedType)?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name</span>
                          <span className="font-medium">{formData.name || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Symbol</span>
                          <Badge variant="glass">{formData.symbol || "—"}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Supply</span>
                          <span className="font-medium">
                            {formData.totalSupply ? Number(formData.totalSupply).toLocaleString() : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Target APY</span>
                          <span className="font-medium text-gain">
                            {formData.targetApy ? `${formData.targetApy}%` : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Network</span>
                          <Badge variant="outline">Mantle Mainnet</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Est. Gas Fee</span>
                          <span className="font-medium">~0.002 MNT (~$0.01)</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border/50 p-6">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                variant="hero"
                onClick={handleNext}
                disabled={!canProceed() || isDeploying}
                className="gap-2"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : currentStep === 4 ? (
                  <>
                    Deploy to Mantle
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
