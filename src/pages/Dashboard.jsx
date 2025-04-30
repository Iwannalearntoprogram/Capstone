import React from 'react';
import ProjectSelector from '../components/ProjectSelector';
import BudgetOverview from '../components/BudgetOverview';
import ExpenseList from '../components/ExpenseList';
import BudgetChart from '../components/BudgetChart';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Project Dashboard</h2>
        <ProjectSelector />
      </div>
      
      <div className="dashboard-content">
        <div className="dashboard-row">
          <BudgetOverview />
          <BudgetChart />
        </div>
        
        <div className="dashboard-row">
          <ExpenseList />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;