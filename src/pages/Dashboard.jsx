import React from 'react';
import ProjectSelector from '../components/ProjectSelector';
import BudgetOverview from '../components/BudgetOverview';
import ExpenseList from '../components/ExpenseList';
import BudgetChart from '../components/BudgetChart';

const Dashboard = () => {
  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <h2>Project Dashboard</h2>
        </div>
        <ProjectSelector />
      </header>

      <div className="dashboard-content">
        <div className="dashboard-row">
          <BudgetOverview />
          <BudgetChart />
        </div>

        <section className="expense-section">
          <h3>Expense Details</h3>
          <ExpenseList />
        </section>
      </div>
    </main>
  );
};

export default Dashboard;
