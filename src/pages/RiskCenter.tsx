import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import {
  Brain,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Shield,
  Activity,
  BarChart3,
  Target,
  Zap,
  RefreshCw,
  ChevronRight,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RiskRadar } from "@/components/charts/RiskRadar";

interface Alert {
  id: string;
  type: "warning" | "critical" | "info";
  title: string;
  description: string;
  asset: string;
  time: string;
  read: boolean;
}

const alerts: Alert[] = [
  {
    id: "1",
    type: "warning",
    title: "Elevated Credit Risk Detected",
    description: "Invoice Factoring Pool showing increased default probability",
    asset: "INVP",
    time: "2m ago",
    read: false,
  },
  {
    id: "2",
    type: "info",
    title: "Market Conditions Improved",
    description: "Treasury yields stabilized, reducing overall portfolio volatility",
    asset: "USTB",
    time: "15m ago",
    read: false,
  },
  {
    id: "3",
    type: "warning",
    title: "Concentration Risk Alert",
    description: "Single asset exceeds 40% of portfolio allocation",
    asset: "USTB",
    time: "1h ago",
    read: true,
  },
];

const riskFactors = [
  { name: "Market Risk", value: 28, trend: "down", change: -3.2 },
  { name: "Credit Risk", value: 42, trend: "up", change: 5.1 },
  { name: "Liquidity Risk", value: 18, trend: "stable", change: 0.4 },
  { name: "Operational Risk", value: 12, trend: "down", change: -1.8 },
  { name: "Regulatory Risk", value: 22, trend: "stable", change: 0.2 },
  { name: "Concentration Risk", value: 35, trend: "up", change: 2.7 },
];

const aiRecommendations = [
  {
    action: "Reduce INVP Exposure",
    reason: "Credit risk indicators suggest 15% probability of delayed payments",
    impact: "Reduce overall portfolio risk by 8%",
    urgency: "medium",
  },
  {
    action: "Increase USTB Allocation",
    reason: "Treasury yields at 6-month high with stable outlook",
    impact: "Improve risk-adjusted returns by 2.3%",
    urgency: "low",
  },
  {
    action: "Enable Auto-Rebalancing",
    reason: "Portfolio drift exceeds optimal thresholds",
    impact: "Maintain target allocation automatically",
    urgency: "low",
  },
];

const portfolioRiskData = {
  market: 28,
  credit: 42,
  liquidity: 18,
  operational: 12,
  regulatory: 22,
  concentration: 35,
};

export function RiskCenter() {
  const [overallRisk, setOverallRisk] = useState(42);
  const [modelAccuracy, setModelAccuracy] = useState(99.4);
  const [analysisTime, setAnalysisTime] = useState(0.34);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setOverallRisk((prev) => Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 2)));
      setModelAccuracy((prev) => Math.max(98, Math.min(99.9, prev + (Math.random() - 0.5) * 0.1)));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getRiskLevel = (score: number) => {
    if (score <= 25) return { label: "Low", color: "gain" as const };
    if (score <= 50) return { label: "Low-Medium", color: "gain" as const };
    if (score <= 75) return { label: "Medium-High", color: "yield" as const };
    return { label: "High", color: "risk" as const };
  };

  const riskLevel = getRiskLevel(overallRisk);

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
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-gold">
              <Brain className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Risk Center</h1>
              <p className="text-muted-foreground">
                Real-time ML-powered portfolio risk analysis
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh Analysis
            </Button>
            <Button variant="hero" size="sm" className="gap-2">
              <Target className="h-4 w-4" />
              Run Stress Test
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Overall Risk Score */}
          <Card variant="elevated" className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Risk Score</p>
                  <div className="flex items-baseline gap-2">
                    <AnimatedNumber
                      value={overallRisk}
                      decimals={0}
                      className="text-4xl font-bold text-foreground"
                    />
                    <span className="text-lg text-muted-foreground">/100</span>
                  </div>
                  <Badge variant={riskLevel.color} className="mt-2">
                    {riskLevel.label} Risk
                  </Badge>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    overallRisk <= 50 ? "bg-gain" : overallRisk <= 75 ? "bg-yield" : "bg-risk"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${overallRisk}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Model Accuracy */}
          <Card variant="glass">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Model Accuracy</p>
              <AnimatedNumber
                value={modelAccuracy}
                suffix="%"
                decimals={1}
                className="text-4xl font-bold text-gain"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Based on 12-month backtest
              </p>
            </CardContent>
          </Card>

          {/* Analysis Speed */}
          <Card variant="glass">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Analysis Time</p>
              <AnimatedNumber
                value={analysisTime}
                suffix="s"
                decimals={2}
                className="text-4xl font-bold text-primary"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Real-time processing
              </p>
            </CardContent>
          </Card>

          {/* Active Alerts */}
          <Card variant="glass">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Active Alerts</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-foreground">
                  {alerts.filter((a) => !a.read).length}
                </span>
                <span className="text-lg text-muted-foreground">
                  / {alerts.length}
                </span>
              </div>
              <Badge variant="yield" className="mt-2">
                {alerts.filter((a) => a.type === "warning").length} Warnings
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Risk Radar & Factors */}
          <div className="lg:col-span-2 space-y-6">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Portfolio Risk Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2">
                  <RiskRadar data={portfolioRiskData} />
                  <div className="space-y-3">
                    {riskFactors.map((factor, i) => (
                      <motion.div
                        key={factor.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {factor.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {factor.value}
                              </span>
                              {factor.trend === "up" ? (
                                <TrendingUp className="h-3 w-3 text-risk" />
                              ) : factor.trend === "down" ? (
                                <TrendingDown className="h-3 w-3 text-gain" />
                              ) : (
                                <Activity className="h-3 w-3 text-muted-foreground" />
                              )}
                              <span
                                className={cn(
                                  "text-xs",
                                  factor.change > 0
                                    ? "text-risk"
                                    : factor.change < 0
                                    ? "text-gain"
                                    : "text-muted-foreground"
                                )}
                              >
                                {factor.change > 0 ? "+" : ""}
                                {factor.change}%
                              </span>
                            </div>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                            <motion.div
                              className={cn(
                                "h-full rounded-full",
                                factor.value <= 30
                                  ? "bg-gain"
                                  : factor.value <= 60
                                  ? "bg-yield"
                                  : "bg-risk"
                              )}
                              initial={{ width: 0 }}
                              animate={{ width: `${factor.value}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1 }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiRecommendations.map((rec, i) => (
                    <motion.div
                      key={rec.action}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="rounded-xl border border-border/50 bg-secondary/20 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground">
                              {rec.action}
                            </h4>
                            <Badge
                              variant={
                                rec.urgency === "high"
                                  ? "risk"
                                  : rec.urgency === "medium"
                                  ? "yield"
                                  : "gain"
                              }
                            >
                              {rec.urgency}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {rec.reason}
                          </p>
                          <p className="mt-2 text-xs text-gain">
                            Impact: {rec.impact}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="gap-1">
                          Apply
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts Panel */}
          <Card variant="elevated" className="h-fit">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Risk Alerts
              </CardTitle>
              <Badge variant="live" className="text-[10px]">
                LIVE
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <AnimatePresence>
                  {alerts.map((alert, i) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        "rounded-xl border p-4",
                        alert.type === "critical"
                          ? "border-risk/50 bg-risk/10"
                          : alert.type === "warning"
                          ? "border-yield/50 bg-yield/10"
                          : "border-border/50 bg-secondary/20",
                        alert.read && "opacity-60"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {alert.type === "critical" || alert.type === "warning" ? (
                          <AlertTriangle
                            className={cn(
                              "h-5 w-5 shrink-0",
                              alert.type === "critical"
                                ? "text-risk"
                                : "text-yield"
                            )}
                          />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-gain" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-foreground truncate">
                              {alert.title}
                            </h4>
                            <Badge variant="glass" className="shrink-0 text-[10px]">
                              {alert.asset}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {alert.description}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {alert.time}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
