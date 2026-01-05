import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { useWallet } from "@/hooks/useWalletConnect";
import { useTokenBalance, useVaultData, useVaultUserData, useComplianceStatus } from "@/hooks/useContracts";
import { useUserData, usePortfolioHistory } from "@/hooks/useSupabase";
import { type Address } from 'viem';
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
  Shield,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PortfolioChart } from "@/components/charts/PortfolioChart";
import { LiveTransactionFeed } from "@/components/LiveTransactionFeed";
import { RiskGauge } from "@/components/RiskGauge";
import { useNavigate } from "react-router-dom";

// Hook for real-time portfolio data combining on-chain and simulated data
const useRealTimePortfolio = (vaultAssetValue: string, tokenBalance: string) => {
  const [data, setData] = useState({
    totalValue: 0,
    dailyPnL: 0,
    dailyPnLPercent: 0,
    weeklyPnL: 0,
    weeklyPnLPercent: 0,
    totalYield: 8.72,
    riskScore: 42,
  });

  useEffect(() => {
    // Combine vault value + token balance for total portfolio
    const vaultVal = parseFloat(vaultAssetValue) || 0;
    const tokenBal = parseFloat(tokenBalance) || 0;
    const totalPortfolio = vaultVal + tokenBal;
    
    setData((prev) => ({
      ...prev,
      totalValue: totalPortfolio,
      dailyPnL: totalPortfolio * 0.0026, // Simulated 0.26% daily gain
      dailyPnLPercent: 0.26,
      weeklyPnL: totalPortfolio * 0.0104,
      weeklyPnLPercent: 1.04,
    }));
  }, [vaultAssetValue, tokenBalance]);

  // Simulate real-time updates for engagement
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => ({
        ...prev,
        dailyPnL: prev.dailyPnL + (Math.random() - 0.48) * (prev.totalValue * 0.0001),
        dailyPnLPercent: prev.dailyPnLPercent + (Math.random() - 0.48) * 0.01,
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return data;
};

// Generate positions dynamically based on real data
const usePositions = (shares: string, assetValue: string, tokenBalance: string, vaultName: string, vaultSymbol: string) => {
  const sharesNum = parseFloat(shares) || 0;
  const assetVal = parseFloat(assetValue) || 0;
  const tokenBal = parseFloat(tokenBalance) || 0;
  const total = assetVal + tokenBal;
  
  return [
    {
      id: 1,
      asset: vaultName || "Meridian US Treasury Vault",
      symbol: vaultSymbol || "mUSTB",
      value: assetVal,
      shares: sharesNum,
      allocation: total > 0 ? Math.round((assetVal / total) * 100) : 0,
      apy: 5.24,
      change: 0.12,
      status: sharesNum > 0 ? "active" : "inactive",
      isReal: true,
    },
    {
      id: 2,
      asset: "MRDL Token Balance",
      symbol: "MRDL",
      value: tokenBal,
      shares: tokenBal,
      allocation: total > 0 ? Math.round((tokenBal / total) * 100) : 0,
      apy: 0,
      change: 0,
      status: tokenBal > 0 ? "active" : "inactive",
      isReal: true,
    },
  ].filter(p => p.value > 0);
};

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
  const navigate = useNavigate();
  const { isConnected, address, connect, shortAddress } = useWallet();
  
  // Real contract data
  const { balance: tokenBalance } = useTokenBalance(address as Address);
  const { totalAssets, totalSupply, vaultName, vaultSymbol } = useVaultData();
  const { shares, assetValue } = useVaultUserData(address as Address);
  const { isCompliant } = useComplianceStatus(address as Address);
  
  // Supabase user data
  const { profile, transactions, notifications, unreadNotifications, ensureProfile } = useUserData(address);
  const { saveSnapshot } = usePortfolioHistory(address);
  
  // Combined portfolio data
  const portfolio = useRealTimePortfolio(assetValue, tokenBalance);
  
  // Generate positions from real data
  const positions = usePositions(shares, assetValue, tokenBalance, vaultName, vaultSymbol);
  
  // Create or fetch user profile on connect
  useEffect(() => {
    if (isConnected && address && !profile) {
      ensureProfile();
    }
  }, [isConnected, address, profile, ensureProfile]);
  
  // Save portfolio snapshot daily
  useEffect(() => {
    if (isConnected && portfolio.totalValue > 0) {
      saveSnapshot(portfolio.totalValue.toString(), positions);
    }
  }, [isConnected, portfolio.totalValue, positions, saveSnapshot]);
  
  // Show connect prompt if not connected
  if (!isConnected) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-gold">
            <Wallet className="h-10 w-10 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Connect your wallet to view your portfolio, deposit to vaults, and start earning yield on RWA investments.
          </p>
          <Button variant="hero" size="lg" onClick={connect} className="gap-2">
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </Button>
        </motion.div>
      </div>
    );
  }

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
              Welcome back, {shortAddress || 'Investor'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground">
                Here's your portfolio performance at a glance
              </p>
              {isCompliant ? (
                <Badge variant="gain" className="gap-1">
                  <Shield className="h-3 w-3" />
                  KYC Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-yellow-500 border-yellow-500/50">
                  <AlertTriangle className="h-3 w-3" />
                  Complete KYC
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="hero"
              size="sm"
              className="gap-2"
              onClick={() => navigate('/app/assets')}
            >
              <ArrowUpRight className="h-4 w-4" />
              <span className="hidden sm:inline">Deposit</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => navigate('/app/assets')}
            >
              <ArrowDownRight className="h-4 w-4" />
              <span className="hidden sm:inline">Withdraw</span>
            </Button>
            {!isCompliant && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => navigate('/app/compliance')}
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Verify KYC</span>
              </Button>
            )}
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
