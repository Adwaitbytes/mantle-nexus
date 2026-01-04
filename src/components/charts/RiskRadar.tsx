import { motion } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface RiskRadarProps {
  data: {
    market: number;
    credit: number;
    liquidity: number;
    operational: number;
    regulatory: number;
    concentration: number;
  };
}

export function RiskRadar({ data }: RiskRadarProps) {
  const chartData = [
    { factor: "Market", value: data.market, fullMark: 100 },
    { factor: "Credit", value: data.credit, fullMark: 100 },
    { factor: "Liquidity", value: data.liquidity, fullMark: 100 },
    { factor: "Operational", value: data.operational, fullMark: 100 },
    { factor: "Regulatory", value: data.regulatory, fullMark: 100 },
    { factor: "Concentration", value: data.concentration, fullMark: 100 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="h-[200px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="hsl(220, 14%, 18%)" />
          <PolarAngleAxis
            dataKey="factor"
            tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 8 }}
            tickCount={4}
          />
          <Radar
            name="Risk"
            dataKey="value"
            stroke="hsl(38, 92%, 50%)"
            fill="hsl(38, 92%, 50%)"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
