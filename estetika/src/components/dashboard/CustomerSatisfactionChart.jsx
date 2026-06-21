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

const CustomerSatisfactionChart = ({ data }) => {
  const chartData = data || [];

  if (!chartData.length) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          color: "#aaa",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 36 }}>⭐</span>
        <span style={{ fontSize: 14 }}>No rating data yet</span>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        width={500}
        height={400}
        data={chartData}
        margin={{
          top: 10,
          right: 8,
          left: -18,
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
        <XAxis dataKey="year" tick={{ fontSize: 11 }} minTickGap={8} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="customerSatisfaction"
          name="Satisfaction %"
          stroke="#28a745"
          fill="url(#colorCustomerSatisfaction)" // Use gradient for fill
        />
        <Area
          type="monotone"
          dataKey="totalRatings"
          name="Total Ratings"
          stroke="#17a2b8"
          fill="url(#colorSupportTicketsResolved)" // Use gradient for fill
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default CustomerSatisfactionChart;
