import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Wallet,
  RefreshCw,
  PieChart,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Zap,
  Clock,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PortfolioChart } from "@/components/charts/PortfolioChart";
import { LiveTransactionFeed } from "@/components/LiveTransactionFeed";
import { RiskGauge } from "@/components/RiskGauge";

// Simulated real-time data
const useRealTimePortfolio = () => {
  const [data, setData] = useState({
    totalValue: 1247832.45,
    dailyPnL: 3247.89,
    dailyPnLPercent: 0.26,
    weeklyPnL: 12847.23,
    weeklyPnLPercent: 1.04,
    totalYield: 8.72,
    riskScore: 42,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => ({
        ...prev,
        totalValue: prev.totalValue + (Math.random() - 0.48) * 100,
        dailyPnL: prev.dailyPnL + (Math.random() - 0.48) * 10,
        dailyPnLPercent: prev.dailyPnLPercent + (Math.random() - 0.48) * 0.01,
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return data;
};

const positions = [
  {
    id: 1,
    asset: "US Treasury Bonds",
    symbol: "USTB",
    value: 561524.60,
    allocation: 45,
    apy: 5.24,
    change: 0.12,
    status: "active",
  },
  {
    id: 2,
    asset: "Real Estate Fund I",
    symbol: "REFI",
    value: 311958.11,
    allocation: 25,
    apy: 12.45,
    change: 0.34,
    status: "active",
  },
  {
    id: 3,
    asset: "Invoice Factoring Pool",
    symbol: "INVP",
    value: 187174.87,
    allocation: 15,
    apy: 18.72,
    change: -0.08,
    status: "warning",
  },
  {
    id: 4,
    asset: "Carbon Credits Vault",
    symbol: "CCRV",
    value: 187174.87,
    allocation: 15,
    apy: 8.91,
    change: 0.56,
    status: "active",
  },
];

const quickActions = [
  { icon: ArrowUpRight, label: "Deposit", variant: "hero" as const },
  { icon: ArrowDownRight, label: "Withdraw", variant: "outline" as const },
  { icon: RefreshCw, label: "Rebalance", variant: "outline" as const },
  { icon: PieChart, label: "Analyze", variant: "outline" as const },
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
  visible: { opacity: 1, y: 0 },
};

export function Dashboard() {
  const portfolio = useRealTimePortfolio();

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, Investor
            </h1>
            <p className="text-muted-foreground">
              Here's your portfolio performance at a glance
            </p>
          </div>
          <div className="flex gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant}
                size="sm"
                className="gap-2"
              >
                <action.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{action.label}</span>
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={itemVariants}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {/* Total Value */}
          <Card variant="glass" className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Portfolio Value
                  </p>
                  <AnimatedNumber
                    value={portfolio.totalValue}
                    prefix="$"
                    decimals={2}
                    className="text-3xl font-bold text-foreground"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="gain" className="gap-1">
                      <ArrowUpRight className="h-3 w-3" />
                      {portfolio.dailyPnLPercent.toFixed(2)}%
                    </Badge>
                    <span className="text-xs text-muted-foreground">24h</span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
              </div>
              {/* Glow effect */}
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
            </CardContent>
          </Card>

          {/* Daily P&L */}
          <Card variant="glass">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Daily P&L</p>
                  <AnimatedNumber
                    value={portfolio.dailyPnL}
                    prefix="+$"
                    decimals={2}
                    className="text-3xl font-bold text-gain"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Weekly: +${portfolio.weeklyPnL.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gain/10">
                  <TrendingUp className="h-6 w-6 text-gain" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Avg Yield */}
          <Card variant="glass">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Blended Yield Rate
                  </p>
                  <AnimatedNumber
                    value={portfolio.totalYield}
                    suffix="%"
                    decimals={2}
                    className="text-3xl font-bold text-primary"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gain">
                      +2.1% vs. market avg
                    </span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Score */}
          <Card variant="glass">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">AI Risk Score</p>
                  <div className="flex items-baseline gap-2">
                    <AnimatedNumber
                      value={portfolio.riskScore}
                      decimals={0}
                      className="text-3xl font-bold text-foreground"
                    />
                    <span className="text-lg text-muted-foreground">/100</span>
                  </div>
                  <Badge variant="gain" className="mt-2">
                    Low-Medium Risk
                  </Badge>
                </div>
                <RiskGauge value={portfolio.riskScore} size={48} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Portfolio Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card variant="elevated" className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">
                  Portfolio Performance
                </CardTitle>
                <div className="flex gap-2">
                  {["1D", "1W", "1M", "1Y", "ALL"].map((period) => (
                    <Button
                      key={period}
                      variant={period === "1M" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 px-3 text-xs"
                    >
                      {period}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <PortfolioChart />
              </CardContent>
            </Card>
          </motion.div>

          {/* Live Activity */}
          <motion.div variants={itemVariants}>
            <Card variant="elevated" className="h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Live Activity
                </CardTitle>
                <Badge variant="live" className="text-[10px]">
                  LIVE
                </Badge>
              </CardHeader>
              <CardContent>
                <LiveTransactionFeed />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Positions Table */}
        <motion.div variants={itemVariants}>
          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold">
                Active Positions
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-2">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="pb-3 text-left text-xs font-medium text-muted-foreground">
                        Asset
                      </th>
                      <th className="pb-3 text-right text-xs font-medium text-muted-foreground">
                        Value
                      </th>
                      <th className="pb-3 text-right text-xs font-medium text-muted-foreground">
                        Allocation
                      </th>
                      <th className="pb-3 text-right text-xs font-medium text-muted-foreground">
                        APY
                      </th>
                      <th className="pb-3 text-right text-xs font-medium text-muted-foreground">
                        24h Change
                      </th>
                      <th className="pb-3 text-right text-xs font-medium text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((pos, i) => (
                      <motion.tr
                        key={pos.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="group border-b border-border/30 last:border-0 hover:bg-secondary/20"
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">
                              {pos.symbol.slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {pos.asset}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {pos.symbol}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-right font-mono text-sm text-foreground">
                          ${pos.value.toLocaleString()}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                              <motion.div
                                className="h-full rounded-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${pos.allocation}%` }}
                                transition={{ duration: 0.8, delay: 0.2 * i }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {pos.allocation}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <span className="font-semibold text-gain">
                            {pos.apy}%
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              pos.change >= 0 ? "text-gain" : "text-risk"
                            )}
                          >
                            {pos.change >= 0 ? "+" : ""}
                            {pos.change}%
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          {pos.status === "active" ? (
                            <CheckCircle2 className="ml-auto h-5 w-5 text-gain" />
                          ) : (
                            <AlertTriangle className="ml-auto h-5 w-5 text-yield" />
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
