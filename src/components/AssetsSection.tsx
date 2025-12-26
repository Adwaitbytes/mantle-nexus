import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "./AnimatedNumber";
import {
  Building2,
  Landmark,
  FileText,
  TrendingUp,
  Shield,
  ArrowUpRight,
} from "lucide-react";

const assets = [
  {
    id: 1,
    name: "US Treasury Bonds",
    symbol: "USTB",
    type: "Government Bonds",
    icon: Landmark,
    apy: 5.24,
    tvl: 245.8,
    risk: "Low",
    riskColor: "gain" as const,
    compliance: ["SEC", "FINRA"],
    change: "+0.12%",
  },
  {
    id: 2,
    name: "Real Estate Fund I",
    symbol: "REFI",
    type: "Commercial Real Estate",
    icon: Building2,
    apy: 12.45,
    tvl: 89.2,
    risk: "Medium",
    riskColor: "yield" as const,
    compliance: ["SEC", "REG-D"],
    change: "+0.34%",
  },
  {
    id: 3,
    name: "Invoice Factoring Pool",
    symbol: "INVP",
    type: "Trade Finance",
    icon: FileText,
    apy: 18.72,
    tvl: 34.5,
    risk: "Medium-High",
    riskColor: "yield" as const,
    compliance: ["MiFID II"],
    change: "+0.08%",
  },
  {
    id: 4,
    name: "Carbon Credits Vault",
    symbol: "CCRV",
    type: "Environmental Assets",
    icon: TrendingUp,
    apy: 8.91,
    tvl: 67.3,
    risk: "Low-Medium",
    riskColor: "gain" as const,
    compliance: ["VCS", "Gold Standard"],
    change: "+0.56%",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export function AssetsSection() {
  return (
    <section id="assets" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <Badge variant="outline" className="mb-4">
            TOKENIZED ASSETS
          </Badge>
          <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Real-World Assets,{" "}
            <span className="text-gradient-gold">On-Chain</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Access institutional-grade yield opportunities through fully 
            compliant tokenized real-world assets.
          </p>
        </motion.div>

        {/* Assets grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-6 md:grid-cols-2"
        >
          {assets.map((asset) => (
            <motion.div key={asset.id} variants={itemVariants}>
              <Card
                variant="elevated"
                className="group cursor-pointer overflow-hidden"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <asset.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{asset.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {asset.type}
                        </p>
                      </div>
                    </div>
                    <Badge variant="glass">{asset.symbol}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {/* APY */}
                    <div>
                      <p className="text-xs text-muted-foreground">APY</p>
                      <div className="flex items-baseline gap-1">
                        <AnimatedNumber
                          value={asset.apy}
                          suffix="%"
                          className="text-xl font-bold text-gain"
                        />
                      </div>
                      <span className="text-xs text-gain">{asset.change}</span>
                    </div>
                    {/* TVL */}
                    <div>
                      <p className="text-xs text-muted-foreground">TVL</p>
                      <AnimatedNumber
                        value={asset.tvl}
                        prefix="$"
                        suffix="M"
                        decimals={1}
                        className="text-xl font-bold text-foreground"
                      />
                    </div>
                    {/* Risk */}
                    <div>
                      <p className="text-xs text-muted-foreground">Risk</p>
                      <Badge variant={asset.riskColor} className="mt-1">
                        {asset.risk}
                      </Badge>
                    </div>
                  </div>

                  {/* Compliance badges */}
                  <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <div className="flex gap-1">
                        {asset.compliance.map((c) => (
                          <span
                            key={c}
                            className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="group/btn">
                      View Details
                      <ArrowUpRight className="h-3 w-3 transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* View all CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <Button variant="outline" size="lg">
            View All Assets
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
