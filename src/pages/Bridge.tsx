import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import {
  ArrowLeftRight,
  ArrowDown,
  ArrowRight,
  Wallet,
  Zap,
  Clock,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Layers,
  Shield,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const networks = {
  ethereum: {
    name: "Ethereum",
    symbol: "ETH",
    icon: "⟠",
    color: "from-blue-500 to-purple-500",
    balance: 2.5847,
  },
  mantle: {
    name: "Mantle",
    symbol: "MNT",
    icon: "◆",
    color: "from-primary to-yellow-500",
    balance: 15847.32,
  },
};

const recentTransactions = [
  {
    id: "1",
    type: "deposit",
    from: "Ethereum",
    to: "Mantle",
    amount: 5000,
    symbol: "USDT",
    status: "confirmed",
    time: "2 min ago",
    hash: "0x7a2f...4b8c",
  },
  {
    id: "2",
    type: "withdraw",
    from: "Mantle",
    to: "Ethereum",
    amount: 2500,
    symbol: "USDT",
    status: "pending",
    time: "15 min ago",
    hash: "0x3c1d...9e2f",
  },
  {
    id: "3",
    type: "deposit",
    from: "Ethereum",
    to: "Mantle",
    amount: 10000,
    symbol: "USDC",
    status: "confirmed",
    time: "1 hour ago",
    hash: "0x8b4e...1c3a",
  },
];

const mantleStats = [
  { label: "Gas Price", value: "0.001", unit: "MNT", icon: Zap },
  { label: "Block Time", value: "2", unit: "sec", icon: Clock },
  { label: "TPS", value: "2,000", unit: "+", icon: TrendingUp },
  { label: "Uptime", value: "99.99", unit: "%", icon: Shield },
];

export function Bridge() {
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"deposit" | "withdraw">("deposit");
  const [isProcessing, setIsProcessing] = useState(false);

  const sourceNetwork = direction === "deposit" ? networks.ethereum : networks.mantle;
  const targetNetwork = direction === "deposit" ? networks.mantle : networks.ethereum;

  const gasEstimate = direction === "deposit" ? 0.002 : 0.001;
  const gasSavings = direction === "deposit" ? 95 : 0;

  const handleSwitch = () => {
    setDirection((prev) => (prev === "deposit" ? "withdraw" : "deposit"));
  };

  const handleBridge = () => {
    if (!amount) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setAmount("");
    }, 2000);
  };

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
              <ArrowLeftRight className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Mantle Bridge</h1>
              <p className="text-muted-foreground">
                Fast, secure bridging between Ethereum and Mantle L2
              </p>
            </div>
          </div>
          <Badge variant="gain" className="gap-2 self-start">
            <div className="h-2 w-2 animate-pulse rounded-full bg-gain" />
            Bridge Online
          </Badge>
        </div>

        {/* Mantle Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          {mantleStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card variant="glass">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-lg font-bold text-foreground">
                      {stat.value}
                      <span className="ml-1 text-sm text-muted-foreground">
                        {stat.unit}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Bridge Interface */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Bridge Card */}
          <Card variant="elevated" className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Bridge Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* From Network */}
              <div className="rounded-xl border border-border/50 bg-secondary/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">From</p>
                  <p className="text-xs text-muted-foreground">
                    Balance: {sourceNetwork.balance.toLocaleString()} {sourceNetwork.symbol}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-2xl text-white",
                      sourceNetwork.color
                    )}
                  >
                    {sourceNetwork.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{sourceNetwork.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {direction === "deposit" ? "L1 Ethereum" : "L2 Mantle"}
                    </p>
                  </div>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-40 text-right text-lg font-bold"
                  />
                </div>
              </div>

              {/* Switch Button */}
              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSwitch}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-border/50 bg-secondary"
                >
                  <ArrowDown className="h-5 w-5 text-foreground" />
                </motion.button>
              </div>

              {/* To Network */}
              <div className="rounded-xl border border-border/50 bg-secondary/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">To</p>
                  <p className="text-xs text-muted-foreground">
                    Balance: {targetNetwork.balance.toLocaleString()} {targetNetwork.symbol}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-2xl text-white",
                      targetNetwork.color
                    )}
                  >
                    {targetNetwork.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{targetNetwork.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {direction === "deposit" ? "L2 Mantle" : "L1 Ethereum"}
                    </p>
                  </div>
                  <div className="w-40 text-right">
                    <p className="text-lg font-bold text-foreground">
                      {amount || "0.00"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ~${((parseFloat(amount) || 0) * 1).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="rounded-xl border border-border/50 bg-secondary/10 p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Gas</span>
                    <span className="text-foreground">
                      {gasEstimate} {sourceNetwork.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bridge Fee</span>
                    <span className="text-foreground">0.1%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Time</span>
                    <span className="text-foreground">~2 minutes</span>
                  </div>
                  {direction === "deposit" && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gas Savings</span>
                      <span className="font-semibold text-gain">Up to {gasSavings}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bridge Button */}
              <Button
                variant="hero"
                size="xl"
                className="w-full gap-2"
                onClick={handleBridge}
                disabled={!amount || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowLeftRight className="h-5 w-5" />
                    Bridge to {targetNetwork.name}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-base">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((tx, i) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-xl border border-border/50 bg-secondary/20 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {tx.type === "deposit" ? (
                          <ArrowDown className="h-4 w-4 text-gain" />
                        ) : (
                          <ArrowRight className="h-4 w-4 text-primary" />
                        )}
                        <span className="text-sm font-medium capitalize">
                          {tx.type}
                        </span>
                      </div>
                      {tx.status === "confirmed" ? (
                        <CheckCircle2 className="h-4 w-4 text-gain" />
                      ) : (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <RefreshCw className="h-4 w-4 text-yield" />
                        </motion.div>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-lg font-bold text-foreground">
                        {tx.amount.toLocaleString()} {tx.symbol}
                      </p>
                      <Badge
                        variant={tx.status === "confirmed" ? "gain" : "yield"}
                        className="text-[10px]"
                      >
                        {tx.status}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {tx.from} → {tx.to}
                      </span>
                      <span>{tx.time}</span>
                    </div>
                    <button className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline">
                      {tx.hash}
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Why Mantle */}
        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-gold text-3xl">
                ◆
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground">
                  Why Bridge to Mantle?
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Mantle L2 offers up to 95% lower gas fees, sub-second finality, and
                  full EVM compatibility. Access MERIDIAN's institutional-grade RWA
                  yield infrastructure with minimal transaction costs.
                </p>
              </div>
              <Button variant="outline" className="gap-2 shrink-0">
                Learn More
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
