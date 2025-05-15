import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  {
    year: "2021",
    sales: 4000,
  },
  {
    year: "2022",
    sales: 3000,
  },
  {
    year: "2023",
    sales: 2000,
  },
  {
    year: "2024",
    sales: 2780,
  },
  {
    year: "2025",
    sales: 1890,
  },
  {
    year: "2026",
    sales: 2500,
  },
  {
    year: "2027",
    sales: 3200,
  },
  {
    year: "2028",
    sales: 1000,
  },
];

const ProjectCompletionChart = () => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        width={500}
        height={400}
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        {/* Define gradient */}
        <defs>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4D3BFF" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#4D3BFF" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid vertical={false} />
        <XAxis dataKey="year" />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="sales"
          stroke="#4D3BFF"
          fill="url(#colorSales)" // Use gradient for fill
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default ProjectCompletionChart;
