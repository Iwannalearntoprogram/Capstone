export const calculateBudgetSummary = (project, expenses) => {
    if (!project) return null;
    
    const totalBudget = project.budget || 0;
    
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const materialsSpent = expenses
      .filter(e => e.category === 'materials')
      .reduce((sum, expense) => sum + expense.amount, 0);
      
    const laborSpent = expenses
      .filter(e => e.category === 'labor')
      .reduce((sum, expense) => sum + expense.amount, 0);
      
    const subcontractorsSpent = expenses
      .filter(e => e.category === 'subcontractors')
      .reduce((sum, expense) => sum + expense.amount, 0);
      
    const otherSpent = expenses
      .filter(e => !['materials', 'labor', 'subcontractors'].includes(e.category))
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    const remainingBudget = totalBudget - totalSpent;
    const percentageSpent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    
    return {
      totalBudget,
      totalSpent,
      remainingBudget,
      percentageSpent,
      materialsSpent,
      laborSpent,
      subcontractorsSpent,
      otherSpent
    };
  };