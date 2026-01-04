import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RiskGaugeProps {
  value: number; // 0-100
  size?: number;
  className?: string;
}

export function RiskGauge({ value, size = 48, className }: RiskGaugeProps) {
  const getColor = (val: number) => {
    if (val <= 33) return "hsl(160, 84%, 39%)"; // gain
    if (val <= 66) return "hsl(38, 92%, 50%)"; // yield
    return "hsl(350, 89%, 60%)"; // risk
  };

  const radius = (size - 8) / 2;
  const circumference = radius * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size / 2 + 4 }}>
      <svg
        width={size}
        height={size / 2 + 4}
        viewBox={`0 0 ${size} ${size / 2 + 4}`}
        className="overflow-visible"
      >
        {/* Background arc */}
        <path
          d={`M 4 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 4} ${size / 2}`}
          fill="none"
          stroke="hsl(220, 14%, 18%)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <motion.path
          d={`M 4 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 4} ${size / 2}`}
          fill="none"
          stroke={getColor(value)}
          strokeWidth="4"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: value / 100 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      {/* Center value */}
      <div className="absolute inset-x-0 bottom-0 text-center">
        <span className="text-xs font-bold text-foreground">{value}</span>
      </div>
    </div>
  );
}
