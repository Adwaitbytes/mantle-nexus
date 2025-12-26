import { motion } from "framer-motion";
import { AnimatedNumber } from "./AnimatedNumber";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Shield, Zap, Globe } from "lucide-react";

const stats = [
  {
    label: "Total Value Locked",
    value: 847.5,
    prefix: "$",
    suffix: "M",
    decimals: 1,
    icon: Shield,
    change: "+12.4%",
  },
  {
    label: "Average APY",
    value: 14.72,
    suffix: "%",
    decimals: 2,
    icon: TrendingUp,
    change: "+2.1%",
  },
  {
    label: "Active Vaults",
    value: 24,
    decimals: 0,
    icon: Zap,
    change: "+3",
  },
  {
    label: "Supported Assets",
    value: 156,
    decimals: 0,
    icon: Globe,
    change: "+18",
  },
];

export function StatsBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
      className="grid grid-cols-2 gap-4 md:grid-cols-4"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
          className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/60 p-4 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-glow"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <stat.icon className="h-4 w-4 text-primary" />
            </div>
            <Badge variant="gain" className="text-[10px]">
              {stat.change}
            </Badge>
          </div>
          <div className="mt-3">
            <AnimatedNumber
              value={stat.value}
              prefix={stat.prefix}
              suffix={stat.suffix}
              decimals={stat.decimals}
              className="text-2xl font-bold text-foreground"
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
          
          {/* Hover glow effect */}
          <div className="absolute inset-0 -z-10 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="absolute inset-0 bg-gradient-radial from-primary/5 to-transparent" />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
