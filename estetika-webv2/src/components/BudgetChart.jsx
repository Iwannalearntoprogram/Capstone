import React, { useContext } from 'react';
import { BudgetContext } from '../context/BudgetContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BudgetChart = () => {
  const { activeProject, getProjectBudgetSummary } = useContext(BudgetContext);
  
  const summary = getProjectBudgetSummary(activeProject);
  
  if (!summary) return <div>No project selected or data available</div>;
  
  const data = [
    {
      name: 'Budget',
      total: summary.totalBudget,
      spent: summary.totalSpent,
      remaining: summary.remainingBudget > 0 ? summary.remainingBudget : 0
    },
    {
      name: 'Materials',
      budget: summary.totalBudget * 0.4, // Assuming 40% for materials
      spent: summary.materialsSpent
    },
    {
      name: 'Labor',
      budget: summary.totalBudget * 0.3, // Assuming 30% for labor
      spent: summary.laborSpent
    },
    {
      name: 'Subcontractors',
      budget: summary.totalBudget * 0.2, // Assuming 20% for subcontractors
      spent: summary.subcontractorsSpent
    },
    {
      name: 'Other',
      budget: summary.totalBudget * 0.1, // Assuming 10% for other
      spent: summary.otherSpent
    }
  ];

  return (
    <div className="budget-chart-container">
      <h3>Budget vs. Actual Spending</h3>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="budget" fill="#8884d8" name="Budgeted" />
            <Bar dataKey="spent" fill="#82ca9d" name="Actual" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BudgetChart;