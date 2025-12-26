import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { AssetsSection } from "@/components/AssetsSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { DashboardPreview } from "@/components/DashboardPreview";
import { MantleSection } from "@/components/MantleSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>MERIDIAN | Institutional-Grade RWA Yield Protocol on Mantle</title>
        <meta
          name="description"
          content="Tokenize, trade, and optimize yield on real-world assets with AI-powered risk assessment and regulatory-ready compliance. Built on Mantle Network."
        />
        <meta
          name="keywords"
          content="RWA, real-world assets, DeFi, yield, tokenization, Mantle, blockchain, institutional, compliance"
        />
        <link rel="canonical" href="https://meridian.finance" />
      </Helmet>
      
      <div className="relative min-h-screen overflow-hidden bg-background">
        <Navbar />
        <main>
          <HeroSection />
          <AssetsSection />
          <FeaturesSection />
          <DashboardPreview />
          <MantleSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
