import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useProfile, useKYCDocuments } from "@/hooks/useSupabase";
import { useWallet } from "@/hooks/useWalletConnect";
import {
  User,
  MapPin,
  FileText,
  Upload,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Shield,
  Building,
  Calendar,
  Globe,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KYCVerificationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface KYCFormData {
  displayName: string;
  email: string;
  dateOfBirth: string;
  address: string;
  city: string;
  country: string;
  jurisdiction: string;
  accreditationType: number;
  identityDoc: File | null;
  addressDoc: File | null;
  accreditationDoc: File | null;
}

const INITIAL_FORM_DATA: KYCFormData = {
  displayName: "",
  email: "",
  dateOfBirth: "",
  address: "",
  city: "",
  country: "",
  jurisdiction: "US",
  accreditationType: 0,
  identityDoc: null,
  addressDoc: null,
  accreditationDoc: null,
};

const steps = [
  { id: 1, name: "Personal Info", icon: User },
  { id: 2, name: "Documents", icon: FileText },
  { id: 3, name: "Review", icon: CheckCircle },
];

const countries = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "SG", name: "Singapore" },
  { code: "JP", name: "Japan" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
];

const accreditationTypes = [
  { value: 0, label: "Non-Accredited Investor" },
  { value: 1, label: "Accredited - Income ($200k+/year)" },
  { value: 2, label: "Accredited - Net Worth ($1M+)" },
  { value: 3, label: "Qualified Institutional Buyer" },
];

export function KYCVerificationWizard({ open, onOpenChange }: KYCVerificationWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<KYCFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { address } = useWallet();
  const { updateProfile } = useProfile(address);
  const { submitDocument } = useKYCDocuments(address);

  const updateField = (field: keyof KYCFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: "identityDoc" | "addressDoc" | "accreditationDoc", file: File | null) => {
    updateField(field, file);
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return !!(
          formData.displayName &&
          formData.email &&
          formData.dateOfBirth &&
          formData.address &&
          formData.city &&
          formData.country
        );
      case 2:
        return !!(formData.identityDoc && formData.addressDoc);
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!address) return;

    setIsSubmitting(true);
    try {
      // 1. Update profile with KYC info
      await updateProfile({
        display_name: formData.displayName,
        email: formData.email,
        jurisdiction: formData.jurisdiction,
        accreditation_type: formData.accreditationType,
        kyc_status: "pending",
      });

      // 2. Submit documents (in production, would upload to Supabase Storage first)
      // For now, we'll just create records with null file_url
      const documents: Array<{
        document_type: string;
        document_name: string;
        file_url: string | null;
      }> = [
        {
          document_type: "identity",
          document_name: formData.identityDoc?.name || "identity_document.pdf",
          file_url: null, // Would be: `${supabaseUrl}/storage/v1/object/public/kyc-documents/${walletAddress}/${fileName}`
        },
        {
          document_type: "address",
          document_name: formData.addressDoc?.name || "address_proof.pdf",
          file_url: null,
        },
      ];

      if (formData.accreditationDoc) {
        documents.push({
          document_type: "accreditation",
          document_name: formData.accreditationDoc.name,
          file_url: null,
        });
      }

      // Submit all documents
      await Promise.all(documents.map((doc) => submitDocument(doc as any)));

      setSubmitSuccess(true);

      // Close modal after 3 seconds
      setTimeout(() => {
        onOpenChange(false);
        setSubmitSuccess(false);
        setStep(1);
        setFormData(INITIAL_FORM_DATA);
      }, 3000);
    } catch (error) {
      console.error("Failed to submit KYC:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    if (submitSuccess) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-12 text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gain/20">
            <CheckCircle className="h-10 w-10 text-gain" />
          </div>
          <h3 className="mb-2 text-2xl font-bold text-foreground">KYC Submitted!</h3>
          <p className="text-muted-foreground mb-4">
            Your documents are under review. We'll notify you once verified.
          </p>
          <Badge variant="yield" className="text-sm">
            Expected processing time: 24-48 hours
          </Badge>
        </motion.div>
      );
    }

    switch (step) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="displayName">Full Name *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => updateField("displayName", e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateField("dateOfBirth", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <select
                    id="country"
                    value={formData.country}
                    onChange={(e) => {
                      updateField("country", e.target.value);
                      updateField("jurisdiction", e.target.value);
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select country</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Street Address *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="123 Main Street"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="New York"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accreditation">Accreditation Status</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <select
                  id="accreditation"
                  value={formData.accreditationType}
                  onChange={(e) => updateField("accreditationType", parseInt(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {accreditationTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="identityDoc">Identity Document * (Passport, Driver's License)</Label>
              <div className="relative">
                <Input
                  id="identityDoc"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange("identityDoc", e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                {formData.identityDoc && (
                  <Badge variant="gain" className="mt-2">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    {formData.identityDoc.name}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressDoc">Proof of Address * (Utility Bill, Bank Statement)</Label>
              <div className="relative">
                <Input
                  id="addressDoc"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange("addressDoc", e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                {formData.addressDoc && (
                  <Badge variant="gain" className="mt-2">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    {formData.addressDoc.name}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accreditationDoc">
                Accreditation Letter (Optional - Required for private offerings)
              </Label>
              <div className="relative">
                <Input
                  id="accreditationDoc"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange("accreditationDoc", e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                {formData.accreditationDoc && (
                  <Badge variant="gain" className="mt-2">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    {formData.accreditationDoc.name}
                  </Badge>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border/50 bg-secondary/20 p-4">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Data Privacy & Security</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your documents are encrypted and stored securely. Only authorized compliance officers can
                    access them. We never share your data with third parties without consent.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h3 className="font-semibold text-foreground">Review Your Information</h3>

            <div className="space-y-3">
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-4">
                <h4 className="mb-3 text-sm font-medium text-muted-foreground">Personal Information</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium text-foreground">{formData.displayName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium text-foreground">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date of Birth:</span>
                    <span className="font-medium text-foreground">{formData.dateOfBirth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Country:</span>
                    <span className="font-medium text-foreground">
                      {countries.find((c) => c.code === formData.country)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address:</span>
                    <span className="font-medium text-foreground">
                      {formData.address}, {formData.city}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border/50 bg-secondary/20 p-4">
                <h4 className="mb-3 text-sm font-medium text-muted-foreground">Accreditation</h4>
                <div className="text-sm">
                  <span className="font-medium text-foreground">
                    {accreditationTypes.find((t) => t.value === formData.accreditationType)?.label}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-border/50 bg-secondary/20 p-4">
                <h4 className="mb-3 text-sm font-medium text-muted-foreground">Documents</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-gain" />
                    <span className="text-foreground">{formData.identityDoc?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-gain" />
                    <span className="text-foreground">{formData.addressDoc?.name}</span>
                  </div>
                  {formData.accreditationDoc && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-gain" />
                      <span className="text-foreground">{formData.accreditationDoc.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
              <p className="text-xs text-muted-foreground">
                By submitting, you confirm that all information provided is accurate and agree to our{" "}
                <span className="text-primary">Terms of Service</span> and{" "}
                <span className="text-primary">Privacy Policy</span>.
              </p>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            KYC Verification
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        {!submitSuccess && (
          <div className="flex items-center justify-between py-4">
            {steps.map((s, idx) => (
              <div key={s.id} className="flex flex-1 items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                      step >= s.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground"
                    )}
                  >
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium transition-colors hidden sm:inline",
                      step >= s.id ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {s.name}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      "mx-2 h-0.5 flex-1 transition-colors",
                      step > s.id ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>

        {/* Actions */}
        {!submitSuccess && (
          <div className="flex justify-between gap-3 pt-4">
            <Button variant="outline" onClick={handleBack} disabled={step === 1 || isSubmitting}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              {step < 3 ? (
                <Button variant="hero" onClick={handleNext} disabled={!validateStep(step)}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button variant="hero" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit KYC
                      <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
