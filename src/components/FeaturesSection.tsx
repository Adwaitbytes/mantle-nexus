import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "./AnimatedNumber";
import {
  Brain,
  Shield,
  Layers,
  Zap,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Risk Assessment",
    description:
      "Real-time portfolio risk scoring powered by machine learning models trained on historical RWA data.",
    stats: { label: "Accuracy", value: 99.4, suffix: "%" },
    highlights: ["Multi-factor analysis", "Predictive alerts", "Custom thresholds"],
  },
  {
    icon: Shield,
    title: "ZK-KYC Compliance",
    description:
      "Regulatory-ready identity verification with selective disclosure. Prove compliance without exposing data.",
    stats: { label: "Privacy Score", value: 100, suffix: "%" },
    highlights: ["Selective disclosure", "Multi-jurisdiction", "Instant verification"],
  },
  {
    icon: Layers,
    title: "Composable Yield",
    description:
      "Stack yield strategies across multiple asset classes. Auto-rebalancing optimizes returns continuously.",
    stats: { label: "Strategies", value: 47, suffix: "+" },
    highlights: ["Auto-compound", "Cross-asset", "Gas optimized"],
  },
  {
    icon: Zap,
    title: "Mantle Native",
    description:
      "Built on Mantle L2 for ultra-low fees and high throughput. Settlement in seconds, not minutes.",
    stats: { label: "Avg Gas", value: 0.001, suffix: " MNT" },
    highlights: ["Sub-second finality", "99.9% uptime", "EVM compatible"],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

export function FeaturesSection() {
  return (
    <section id="protocol" className="relative py-24">
      {/* Background accent */}
      <div className="absolute right-0 top-1/2 h-[800px] w-[800px] -translate-y-1/2 translate-x-1/2">
        <div className="h-full w-full rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <Badge variant="outline" className="mb-4">
            PROTOCOL FEATURES
          </Badge>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                Infrastructure for the{" "}
                <span className="text-gradient-gold">Future</span>
              </h2>
              <p className="mt-4 max-w-xl text-muted-foreground">
                Enterprise-grade architecture designed for institutional adoption 
                and regulatory compliance.
              </p>
            </div>
            <Button variant="hero" className="self-start md:self-auto">
              Read Whitepaper
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-6 md:grid-cols-2"
        >
          {features.map((feature, index) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <Card
                variant="glass"
                className="group h-full overflow-hidden transition-all hover:border-primary/30"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <motion.div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-gold"
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <feature.icon className="h-7 w-7 text-primary-foreground" />
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-6 flex items-center gap-6 border-t border-border/50 pt-6">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {feature.stats.label}
                      </p>
                      <AnimatedNumber
                        value={feature.stats.value}
                        suffix={feature.stats.suffix}
                        decimals={feature.stats.value < 1 ? 3 : 1}
                        className="text-2xl font-bold text-primary"
                      />
                    </div>
                    <div className="h-10 w-px bg-border/50" />
                    <div className="flex flex-wrap gap-2">
                      {feature.highlights.map((h) => (
                        <span
                          key={h}
                          className="flex items-center gap-1 text-xs text-muted-foreground"
                        >
                          <CheckCircle2 className="h-3 w-3 text-gain" />
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
