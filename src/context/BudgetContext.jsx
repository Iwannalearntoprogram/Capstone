import React, { createContext, useState, useEffect } from 'react';
import { calculateBudgetSummary } from '../utils/budgetCalculations';

export const BudgetContext = createContext();

export const BudgetProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [vendors, setVendors] = useState([]);
  
  // Load data from localStorage on initial render
  useEffect(() => {
    const savedProjects = JSON.parse(localStorage.getItem('designProjects')) || [];
    const savedExpenses = JSON.parse(localStorage.getItem('designExpenses')) || [];
    const savedVendors = JSON.parse(localStorage.getItem('designVendors')) || [];
    
    setProjects(savedProjects);
    setExpenses(savedExpenses);
    setVendors(savedVendors);
    if (savedProjects.length > 0) {
      setActiveProject(savedProjects[0].id);
    }
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('designProjects', JSON.stringify(projects));
    localStorage.setItem('designExpenses', JSON.stringify(expenses));
    localStorage.setItem('designVendors', JSON.stringify(vendors));
  }, [projects, expenses, vendors]);

  const addProject = (project) => {
    setProjects([...projects, project]);
  };

  const addExpense = (expense) => {
    setExpenses([...expenses, expense]);
  };

  const addVendor = (vendor) => {
    setVendors([...vendors, vendor]);
  };

  const getProjectBudgetSummary = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;
    
    const projectExpenses = expenses.filter(e => e.projectId === projectId);
    return calculateBudgetSummary(project, projectExpenses);
  };

  return (
    <BudgetContext.Provider value={{
      projects,
      activeProject,
      setActiveProject,
      expenses,
      vendors,
      addProject,
      addExpense,
      addVendor,
      getProjectBudgetSummary
    }}>
      {children}
    </BudgetContext.Provider>
  );
};