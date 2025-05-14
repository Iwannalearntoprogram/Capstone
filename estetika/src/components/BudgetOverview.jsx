import React, { useContext } from 'react';
import { BudgetContext } from '../context/BudgetContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const BudgetOverview = () => {
  const { activeProject, getProjectBudgetSummary } = useContext(BudgetContext);
  
  const summary = getProjectBudgetSummary(activeProject);
  
  if (!summary) return <div>No project selected or data available</div>;
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  const pieData = [
    { name: 'Materials', value: summary.materialsSpent },
    { name: 'Labor', value: summary.laborSpent },
    { name: 'Subcontractors', value: summary.subcontractorsSpent },
    { name: 'Other', value: summary.otherSpent },
    { name: 'Remaining', value: summary.remainingBudget },
  ];

  return (
    <div className="budget-overview">
      <h2>Budget Overview</h2>
      
      <div className="budget-summary">
        <div className="summary-item">
          <span>Total Budget:</span>
          <span>${summary.totalBudget.toLocaleString()}</span>
        </div>
        <div className="summary-item">
          <span>Total Spent:</span>
          <span>${summary.totalSpent.toLocaleString()}</span>
        </div>
        <div className="summary-item">
          <span>Remaining:</span>
          <span className={summary.remainingBudget < 0 ? 'negative' : 'positive'}>
            ${summary.remainingBudget.toLocaleString()}
          </span>
        </div>
        <div className="summary-item">
          <span>Percentage Spent:</span>
          <span>{summary.percentageSpent}%</span>
        </div>
      </div>
      
      <div className="budget-chart">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BudgetOverview;