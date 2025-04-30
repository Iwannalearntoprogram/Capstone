import React from 'react';
import { useParams } from 'react-router-dom';
import BudgetOverview from '../components/BudgetOverview';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';
import VendorList from '../components/VendorList';

const ProjectDetail = () => {
  const { projectId } = useParams();
  
  return (
    <div className="project-detail">
      <h2>Project Details</h2>
      
      <div className="project-content">
        <div className="project-section">
          <BudgetOverview />
        </div>
        
        <div className="project-section">
          <h3>Add New Expense</h3>
          <ExpenseForm />
        </div>
        
        <div className="project-section">
          <ExpenseList />
        </div>
        
        <div className="project-section">
          <VendorList />
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;