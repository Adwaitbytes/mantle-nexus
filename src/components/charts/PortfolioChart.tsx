import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Generate realistic portfolio data
const generateData = () => {
  const data = [];
  let value = 1100000;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = 30; i >= 0; i--) {
    const date = new Date(now - i * dayMs);
    const volatility = Math.random() * 0.02 - 0.008; // Slight upward bias
    value = value * (1 + volatility);
    
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: Math.round(value),
      yield: 8.5 + Math.random() * 0.5,
    });
  }
  return data;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/95 p-4 shadow-lg backdrop-blur-sm">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-lg font-bold text-foreground">
          ${payload[0].value.toLocaleString()}
        </p>
        <p className="mt-1 text-xs text-gain">
          Yield: {payload[0].payload.yield.toFixed(2)}%
        </p>
      </div>
    );
  }
  return null;
};

export function PortfolioChart() {
  const [data, setData] = useState(generateData);
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    setIsAnimated(true);
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      setData((prev) => {
        const newData = [...prev];
        const lastValue = newData[newData.length - 1].value;
        const change = lastValue * (Math.random() * 0.002 - 0.0008);
        newData[newData.length - 1] = {
          ...newData[newData.length - 1],
          value: Math.round(lastValue + change),
        };
        return newData;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-[300px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="hsl(38, 92%, 50%)"
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor="hsl(38, 92%, 50%)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(220, 14%, 18%)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
            tickFormatter={(value) => `$${(value / 1000000).toFixed(2)}M`}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(38, 92%, 50%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorValue)"
            animationDuration={isAnimated ? 0 : 1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
