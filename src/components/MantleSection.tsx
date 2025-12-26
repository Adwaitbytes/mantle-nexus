import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Hexagon,
  Layers,
  Zap,
  Shield,
  Globe,
} from "lucide-react";

const mantleFeatures = [
  {
    icon: Zap,
    title: "Ultra-Low Fees",
    description: "Transaction costs up to 95% lower than Ethereum mainnet",
    stat: "~$0.001",
  },
  {
    icon: Layers,
    title: "High Throughput",
    description: "Process thousands of transactions per second",
    stat: "2,000+ TPS",
  },
  {
    icon: Shield,
    title: "EVM Compatible",
    description: "Deploy existing Solidity contracts without modification",
    stat: "100%",
  },
  {
    icon: Globe,
    title: "Modular Stack",
    description: "Separation of execution, consensus, and data availability",
    stat: "L2 Native",
  },
];

export function MantleSection() {
  return (
    <section className="relative py-24">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4">
              POWERED BY MANTLE
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Built on{" "}
              <span className="text-gradient-gold">Mantle L2</span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              MERIDIAN leverages Mantle Network's modular architecture to deliver 
              institutional-grade performance with consumer-friendly costs. Every 
              transaction, every yield optimization, every rebalancing event — 
              executed with precision and minimal friction.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {mantleFeatures.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-xl border border-border/50 bg-card/50 p-4"
                >
                  <feature.icon className="h-5 w-5 text-primary" />
                  <h4 className="mt-2 font-semibold text-foreground">
                    {feature.title}
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {feature.description}
                  </p>
                  <p className="mt-2 font-mono text-lg font-bold text-primary">
                    {feature.stat}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 flex gap-4">
              <Button variant="hero">
                View Docs
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline">
                Mantle Explorer
              </Button>
            </div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative flex items-center justify-center"
          >
            {/* Animated hexagon grid */}
            <div className="relative">
              {/* Central glow */}
              <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2">
                <div className="h-full w-full rounded-full bg-primary/20 blur-[60px]" />
              </div>

              {/* Hexagon pattern */}
              <div className="relative grid grid-cols-3 gap-4">
                {[...Array(9)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: 0.05 * i,
                      type: "spring",
                      stiffness: 200,
                      damping: 20,
                    }}
                    className="group"
                  >
                    <div
                      className={`flex h-24 w-24 items-center justify-center rounded-2xl border transition-all duration-300 ${
                        i === 4
                          ? "border-primary/50 bg-gradient-gold shadow-glow"
                          : "border-border/30 bg-card/50 hover:border-primary/30 hover:bg-card"
                      }`}
                    >
                      <Hexagon
                        className={`h-8 w-8 transition-transform group-hover:scale-110 ${
                          i === 4 ? "text-primary-foreground" : "text-primary/50"
                        }`}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Floating labels */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute -left-12 top-0 rounded-lg border border-border/50 bg-card px-3 py-1.5 text-xs"
              >
                Execution Layer
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="absolute -right-12 top-1/3 rounded-lg border border-border/50 bg-card px-3 py-1.5 text-xs"
              >
                Consensus Layer
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 }}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs text-primary"
              >
                Data Availability
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
