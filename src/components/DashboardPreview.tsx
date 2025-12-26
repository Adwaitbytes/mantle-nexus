import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "./AnimatedNumber";
import { 
  ArrowUpRight, 
  Wallet, 
  BarChart3, 
  RefreshCw,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

const portfolioData = {
  totalValue: 1247832.45,
  dailyPnL: 3247.89,
  dailyPnLPercent: 0.26,
  positions: [
    { asset: "USTB", allocation: 45, value: 561524.60, apy: 5.24 },
    { asset: "REFI", allocation: 25, value: 311958.11, apy: 12.45 },
    { asset: "INVP", allocation: 15, value: 187174.87, apy: 18.72 },
    { asset: "CCRV", allocation: 15, value: 187174.87, apy: 8.91 },
  ],
  riskScore: 42,
  riskLevel: "Low-Medium",
};

export function DashboardPreview() {
  return (
    <section id="yield" className="relative py-24">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      
      <div className="relative mx-auto max-w-7xl px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <Badge variant="outline" className="mb-4">
            YIELD DASHBOARD
          </Badge>
          <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Manage Your{" "}
            <span className="text-gradient-gold">Portfolio</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Institutional-grade portfolio management with real-time analytics, 
            risk monitoring, and automated rebalancing.
          </p>
        </motion.div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          {/* Browser chrome */}
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-card">
            {/* Browser header */}
            <div className="flex items-center gap-2 border-b border-border/50 bg-secondary/50 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-risk/60" />
                <div className="h-3 w-3 rounded-full bg-yield/60" />
                <div className="h-3 w-3 rounded-full bg-gain/60" />
              </div>
              <div className="ml-4 flex-1 rounded-lg bg-background/50 px-3 py-1 text-xs text-muted-foreground">
                app.meridian.finance/dashboard
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-6">
              {/* Top bar */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-gold">
                    <Wallet className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Connected</p>
                    <p className="font-mono text-sm text-foreground">0x7a2F...4b8c</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4" />
                    Rebalance
                  </Button>
                  <Button variant="hero" size="sm">
                    Deposit
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Portfolio value */}
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
                  <div className="mt-1 flex items-baseline gap-3">
                    <AnimatedNumber
                      value={portfolioData.totalValue}
                      prefix="$"
                      decimals={2}
                      className="text-4xl font-bold text-foreground md:text-5xl"
                    />
                    <Badge variant="gain" className="text-sm">
                      +${portfolioData.dailyPnL.toLocaleString()} ({portfolioData.dailyPnLPercent}%)
                    </Badge>
                  </div>
                </div>
                
                {/* Risk score */}
                <div className="rounded-xl border border-border/50 bg-secondary/30 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">AI Risk Score</p>
                    <Badge variant="gain">{portfolioData.riskLevel}</Badge>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-end justify-between">
                      <AnimatedNumber
                        value={portfolioData.riskScore}
                        suffix="/100"
                        decimals={0}
                        className="text-3xl font-bold text-foreground"
                      />
                      <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-gain to-yield"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${portfolioData.riskScore}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.3 }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Positions table */}
              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Active Positions</h3>
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </div>
                <div className="overflow-hidden rounded-xl border border-border/50">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50 bg-secondary/30">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Asset</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Allocation</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Value</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">APY</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioData.positions.map((pos, i) => (
                        <motion.tr
                          key={pos.asset}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.1 * i }}
                          className="border-b border-border/30 last:border-0"
                        >
                          <td className="px-4 py-4">
                            <span className="font-medium text-foreground">{pos.asset}</span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                                <div
                                  className="h-full rounded-full bg-primary"
                                  style={{ width: `${pos.allocation}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground">{pos.allocation}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right font-mono text-sm text-foreground">
                            ${pos.value.toLocaleString()}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="font-semibold text-gain">{pos.apy}%</span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <CheckCircle2 className="ml-auto h-4 w-4 text-gain" />
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Floating elements */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="absolute -right-4 top-32 hidden rounded-xl border border-border/50 bg-card p-3 shadow-card lg:block"
          >
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 animate-pulse rounded-full bg-gain" />
              <span className="text-muted-foreground">Auto-rebalancing active</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
            className="absolute -left-4 bottom-32 hidden rounded-xl border border-yellow-500/20 bg-card p-3 shadow-card lg:block"
          >
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-muted-foreground">Yield opportunity detected</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
