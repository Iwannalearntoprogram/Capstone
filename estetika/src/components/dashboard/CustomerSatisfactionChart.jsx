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
    customerSatisfaction: 85,
    supportTicketsResolved: 110,
  },
  {
    year: "2022",
    customerSatisfaction: 82,
    supportTicketsResolved: 140,
  },
  {
    year: "2023",
    customerSatisfaction: 88,
    supportTicketsResolved: 160,
  },
  {
    year: "2024",
    customerSatisfaction: 91,
    supportTicketsResolved: 190,
  },
  {
    year: "2025",
    customerSatisfaction: 87,
    supportTicketsResolved: 180,
  },
  {
    year: "2026",
    customerSatisfaction: 89,
    supportTicketsResolved: 200,
  },
  {
    year: "2027",
    customerSatisfaction: 92,
    supportTicketsResolved: 220,
  },
  {
    year: "2028",
    customerSatisfaction: 90,
    supportTicketsResolved: 210,
  },
];

const CustomerSatisfactionChart = () => {
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
        {/* Define gradients */}
        <defs>
          <linearGradient
            id="colorCustomerSatisfaction"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="5%" stopColor="#28a745" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#28a745" stopOpacity={0} />
          </linearGradient>
          <linearGradient
            id="colorSupportTicketsResolved"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="5%" stopColor="#17a2b8" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#17a2b8" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid vertical={false} />
        <XAxis dataKey="year" />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="customerSatisfaction"
          stroke="#28a745"
          fill="url(#colorCustomerSatisfaction)" // Use gradient for fill
        />
        <Area
          type="monotone"
          dataKey="supportTicketsResolved"
          stroke="#17a2b8"
          fill="url(#colorSupportTicketsResolved)" // Use gradient for fill
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default CustomerSatisfactionChart;
