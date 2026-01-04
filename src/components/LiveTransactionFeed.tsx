import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, RefreshCw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: "deposit" | "withdraw" | "yield" | "rebalance";
  asset: string;
  amount: number;
  time: string;
  status: "confirmed" | "pending";
}

const transactionTypes = {
  deposit: { icon: ArrowUpRight, color: "text-gain", label: "Deposited" },
  withdraw: { icon: ArrowDownRight, color: "text-risk", label: "Withdrew" },
  yield: { icon: ArrowUpRight, color: "text-primary", label: "Yield Earned" },
  rebalance: { icon: RefreshCw, color: "text-muted-foreground", label: "Rebalanced" },
};

const assets = ["USTB", "REFI", "INVP", "CCRV"];
const amounts = [5000, 10000, 25000, 50000, 100000, 250000];

const generateTransaction = (): Transaction => {
  const types = ["deposit", "yield", "yield", "yield", "rebalance"] as const;
  const type = types[Math.floor(Math.random() * types.length)];
  
  return {
    id: Math.random().toString(36).substring(7),
    type,
    asset: assets[Math.floor(Math.random() * assets.length)],
    amount: amounts[Math.floor(Math.random() * amounts.length)] + Math.random() * 1000,
    time: "Just now",
    status: Math.random() > 0.1 ? "confirmed" : "pending",
  };
};

export function LiveTransactionFeed() {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    Array.from({ length: 5 }, generateTransaction).map((t, i) => ({
      ...t,
      time: `${i * 2 + 1}m ago`,
    }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTransactions((prev) => {
        const newTx = generateTransaction();
        return [newTx, ...prev.slice(0, 4)].map((t, i) => ({
          ...t,
          time: i === 0 ? "Just now" : `${i * 2 + 1}m ago`,
        }));
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {transactions.map((tx) => {
          const config = transactionTypes[tx.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={tx.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="flex items-center gap-3 rounded-xl bg-secondary/30 p-3"
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary",
                  config.color
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {config.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {tx.asset}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm font-semibold", config.color)}>
                    {tx.type === "withdraw" ? "-" : "+"}$
                    {tx.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-xs text-muted-foreground">{tx.time}</span>
                </div>
              </div>
              {tx.status === "confirmed" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-gain" />
              ) : (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="h-4 w-4 shrink-0 text-muted-foreground" />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
