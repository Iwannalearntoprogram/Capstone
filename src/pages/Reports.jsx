import React, { useContext } from 'react';
import { BudgetContext } from '../context/BudgetContext';
import BudgetChart from '../components/BudgetChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports = () => {
  const { projects, expenses } = useContext(BudgetContext);
  
  // Generate report data
  const projectReportData = projects.map(project => {
    const projectExpenses = expenses.filter(e => e.projectId === project.id);
    const totalSpent = projectExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    return {
      name: project.name,
      budget: project.budget,
      spent: totalSpent,
      remaining: project.budget - totalSpent
    };
  });
  
  const categoryReportData = projects.length > 0 ? [
    {
      name: 'Materials',
      spent: expenses
        .filter(e => e.category === 'materials')
        .reduce((sum, e) => sum + e.amount, 0)
    },
    {
      name: 'Labor',
      spent: expenses
        .filter(e => e.category === 'labor')
        .reduce((sum, e) => sum + e.amount, 0)
    },
    {
      name: 'Subcontractors',
      spent: expenses
        .filter(e => e.category === 'subcontractors')
        .reduce((sum, e) => sum + e.amount, 0)
    },
    {
      name: 'Other',
      spent: expenses
        .filter(e => !['materials', 'labor', 'subcontractors'].includes(e.category))
        .reduce((sum, e) => sum + e.amount, 0)
    }
  ] : [];

  return (
    <div className="reports-page">
      <h2>Financial Reports</h2>
      
      <div className="report-section">
        <h3>Project Budget Summary</h3>
        {projects.length > 0 ? (
          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <BarChart
                data={projectReportData}
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
                <Bar dataKey="budget" fill="#8884d8" name="Budget" />
                <Bar dataKey="spent" fill="#82ca9d" name="Spent" />
                <Bar dataKey="remaining" fill="#ffc658" name="Remaining" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p>No projects available for reporting.</p>
        )}
      </div>
      
      <div className="report-section">
        <h3>Spending by Category</h3>
        {projects.length > 0 ? (
          <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <BarChart
                data={categoryReportData}
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
                <Bar dataKey="spent" fill="#ff8042" name="Amount Spent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p>No spending data available.</p>
        )}
      </div>
    </div>
  );
};

export default Reports;