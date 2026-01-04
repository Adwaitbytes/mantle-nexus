import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { TokenizationWizard } from "@/components/TokenizationWizard";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  ArrowUpRight,
  Shield,
  TrendingUp,
  Building2,
  Landmark,
  FileText,
  Leaf,
  BarChart3,
  Star,
  Info,
  ChevronRight,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RiskRadar } from "@/components/charts/RiskRadar";

const assets = [
  {
    id: 1,
    name: "US Treasury Bonds",
    symbol: "USTB",
    type: "Government Bonds",
    icon: Landmark,
    description: "Tokenized US Treasury securities with daily yield distribution",
    apy: 5.24,
    tvl: 245800000,
    risk: "Low",
    riskScore: 15,
    riskColor: "gain" as const,
    compliance: ["SEC", "FINRA"],
    minInvestment: 1000,
    lockPeriod: "None",
    featured: true,
    riskFactors: {
      market: 10,
      credit: 5,
      liquidity: 8,
      operational: 12,
      regulatory: 5,
      concentration: 15,
    },
  },
  {
    id: 2,
    name: "Real Estate Fund I",
    symbol: "REFI",
    type: "Commercial Real Estate",
    icon: Building2,
    description: "Diversified commercial real estate portfolio across major US metros",
    apy: 12.45,
    tvl: 89200000,
    risk: "Medium",
    riskScore: 45,
    riskColor: "yield" as const,
    compliance: ["SEC", "REG-D"],
    minInvestment: 5000,
    lockPeriod: "90 days",
    featured: true,
    riskFactors: {
      market: 45,
      credit: 30,
      liquidity: 55,
      operational: 35,
      regulatory: 25,
      concentration: 50,
    },
  },
  {
    id: 3,
    name: "Invoice Factoring Pool",
    symbol: "INVP",
    type: "Trade Finance",
    icon: FileText,
    description: "Short-term receivables from verified enterprise counterparties",
    apy: 18.72,
    tvl: 34500000,
    risk: "Medium-High",
    riskScore: 62,
    riskColor: "yield" as const,
    compliance: ["MiFID II"],
    minInvestment: 10000,
    lockPeriod: "30 days",
    featured: false,
    riskFactors: {
      market: 30,
      credit: 65,
      liquidity: 40,
      operational: 55,
      regulatory: 45,
      concentration: 70,
    },
  },
  {
    id: 4,
    name: "Carbon Credits Vault",
    symbol: "CCRV",
    type: "Environmental Assets",
    icon: Leaf,
    description: "Verified carbon credits from reforestation and renewable energy projects",
    apy: 8.91,
    tvl: 67300000,
    risk: "Low-Medium",
    riskScore: 28,
    riskColor: "gain" as const,
    compliance: ["VCS", "Gold Standard"],
    minInvestment: 2500,
    lockPeriod: "None",
    featured: false,
    riskFactors: {
      market: 35,
      credit: 15,
      liquidity: 45,
      operational: 20,
      regulatory: 25,
      concentration: 30,
    },
  },
  {
    id: 5,
    name: "Private Credit Fund",
    symbol: "PCRV",
    type: "Private Debt",
    icon: BarChart3,
    description: "Senior secured loans to middle-market companies",
    apy: 14.32,
    tvl: 156400000,
    risk: "Medium",
    riskScore: 48,
    riskColor: "yield" as const,
    compliance: ["SEC", "REG-D"],
    minInvestment: 25000,
    lockPeriod: "180 days",
    featured: true,
    riskFactors: {
      market: 40,
      credit: 55,
      liquidity: 65,
      operational: 30,
      regulatory: 35,
      concentration: 45,
    },
  },
  {
    id: 6,
    name: "Infrastructure Bonds",
    symbol: "INFB",
    type: "Infrastructure",
    icon: Building2,
    description: "Investment-grade infrastructure project bonds",
    apy: 7.85,
    tvl: 198700000,
    risk: "Low",
    riskScore: 22,
    riskColor: "gain" as const,
    compliance: ["SEC", "FINRA"],
    minInvestment: 5000,
    lockPeriod: "None",
    featured: false,
    riskFactors: {
      market: 20,
      credit: 15,
      liquidity: 25,
      operational: 18,
      regulatory: 12,
      concentration: 28,
    },
  },
];

const filters = ["All", "Government", "Real Estate", "Private Credit", "Trade Finance", "ESG"];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function Assets() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedAsset, setSelectedAsset] = useState<typeof assets[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);

  const filteredAssets = assets.filter((asset) => {
    if (searchQuery && !asset.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (activeFilter === "All") return true;
    if (activeFilter === "Government") return asset.type.includes("Government");
    if (activeFilter === "Real Estate") return asset.type.includes("Real Estate");
    if (activeFilter === "Private Credit") return asset.type.includes("Private");
    if (activeFilter === "Trade Finance") return asset.type.includes("Trade");
    if (activeFilter === "ESG") return asset.type.includes("Environmental");
    return true;
  });

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Asset Explorer</h1>
            <p className="text-muted-foreground">
              Browse and invest in tokenized real-world assets
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="hero"
              size="sm"
              className="gap-2"
              onClick={() => setWizardOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Tokenize Asset
            </Button>
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setView("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {filters.map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveFilter(filter)}
                className="shrink-0"
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card variant="glass">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Assets</p>
              <p className="text-2xl font-bold text-foreground">{assets.length}</p>
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Combined TVL</p>
              <AnimatedNumber
                value={791.9}
                prefix="$"
                suffix="M"
                decimals={1}
                className="text-2xl font-bold text-foreground"
              />
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Avg APY</p>
              <AnimatedNumber
                value={11.25}
                suffix="%"
                decimals={2}
                className="text-2xl font-bold text-gain"
              />
            </CardContent>
          </Card>
          <Card variant="glass">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Compliance Rate</p>
              <AnimatedNumber
                value={100}
                suffix="%"
                decimals={0}
                className="text-2xl font-bold text-primary"
              />
            </CardContent>
          </Card>
        </div>

        {/* Assets Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={cn(
            "grid gap-4",
            view === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          )}
        >
          {filteredAssets.map((asset) => (
            <motion.div key={asset.id} variants={itemVariants}>
              <Card
                variant="elevated"
                className="group cursor-pointer overflow-hidden transition-all hover:border-primary/30"
                onClick={() => setSelectedAsset(asset)}
              >
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <asset.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{asset.name}</h3>
                          {asset.featured && (
                            <Star className="h-4 w-4 fill-primary text-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{asset.type}</p>
                      </div>
                    </div>
                    <Badge variant="glass">{asset.symbol}</Badge>
                  </div>

                  {/* Description */}
                  <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                    {asset.description}
                  </p>

                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">APY</p>
                      <p className="text-lg font-bold text-gain">{asset.apy}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">TVL</p>
                      <p className="text-lg font-bold text-foreground">
                        ${(asset.tvl / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Risk</p>
                      <Badge variant={asset.riskColor}>{asset.risk}</Badge>
                    </div>
                  </div>

                  {/* Compliance */}
                  <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <div className="flex gap-1">
                        {asset.compliance.map((c) => (
                          <span
                            key={c}
                            className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="group/btn gap-1">
                      Invest
                      <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Asset Detail Modal */}
        {selectedAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedAsset(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl border border-border/50 bg-card p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <selectedAsset.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-foreground">
                      {selectedAsset.name}
                    </h2>
                    <Badge variant="glass">{selectedAsset.symbol}</Badge>
                    {selectedAsset.featured && (
                      <Badge variant="outline" className="gap-1">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-muted-foreground">{selectedAsset.type}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedAsset(null)}
                >
                  ✕
                </Button>
              </div>

              <p className="mt-6 text-muted-foreground">{selectedAsset.description}</p>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {/* Key Metrics */}
                <Card variant="glass">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">APY</span>
                      <span className="font-bold text-gain">{selectedAsset.apy}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">TVL</span>
                      <span className="font-bold">
                        ${(selectedAsset.tvl / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Investment</span>
                      <span className="font-bold">
                        ${selectedAsset.minInvestment.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lock Period</span>
                      <span className="font-bold">{selectedAsset.lockPeriod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Risk Score</span>
                      <Badge variant={selectedAsset.riskColor}>
                        {selectedAsset.riskScore}/100
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Radar */}
                <Card variant="glass">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">AI Risk Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RiskRadar data={selectedAsset.riskFactors} />
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 flex gap-3">
                <Button variant="hero" className="flex-1 gap-2">
                  <ArrowUpRight className="h-4 w-4" />
                  Invest Now
                </Button>
                <Button variant="outline" className="gap-2">
                  <Info className="h-4 w-4" />
                  Full Details
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Tokenization Wizard */}
        <TokenizationWizard open={wizardOpen} onOpenChange={setWizardOpen} />
      </motion.div>
    </div>
  );
}
