import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const ProjectStatesPieChart = ({ data }) => {
  // Default data for loading state
  const defaultData = [
    { name: "Active", value: 0, color: "#10B981" },
    { name: "Completed", value: 0, color: "#F59E0B" },
    { name: "Delayed", value: 0, color: "#EF4444" },
    { name: "Cancelled", value: 0, color: "#8B5CF6" },
  ];

  // Transform project states data to pie chart format
  const pieData = data
    ? [
        { name: "Active", value: data.active || 0, color: "#10B981" },
        { name: "Completed", value: data.completed || 0, color: "#F59E0B" },
        { name: "Delayed", value: data.delayed || 0, color: "#EF4444" },
        { name: "Cancelled", value: data.cancelled || 0, color: "#8B5CF6" },
      ]
    : defaultData;

  // Filter out zero values for better visualization
  const filteredData = pieData.filter((entry) => entry.value > 0);
  const dataToShow = filteredData.length > 0 ? filteredData : pieData;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-gray-600">
            Projects:{" "}
            <span className="font-bold text-gray-900">{data.value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm font-medium text-gray-700">
              {entry.value}:{" "}
              {dataToShow.find((d) => d.name === entry.value)?.value || 0}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={dataToShow}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {dataToShow.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ProjectStatesPieChart;
