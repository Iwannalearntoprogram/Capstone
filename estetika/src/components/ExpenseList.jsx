import React, { useContext } from "react";
// import { BudgetContext } from '../context/BudgetContext';

const ExpenseList = () => {
  const { activeProject, expenses } = useContext(BudgetContext);

  const projectExpenses = expenses.filter((e) => e.projectId === activeProject);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getCategoryColor = (category) => {
    const colors = {
      materials: "#0088FE",
      labor: "#00C49F",
      subcontractors: "#FFBB28",
      furniture: "#FF8042",
      fixtures: "#8884D8",
      other: "#A4DE6C",
    };
    return colors[category] || "#8884D8";
  };

  return (
    <div className="expense-list">
      <h3>Project Expenses</h3>

      {projectExpenses.length === 0 ? (
        <p>No expenses recorded for this project yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Vendor</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {projectExpenses.map((expense) => (
              <tr key={expense.id}>
                <td>{formatDate(expense.date)}</td>
                <td>{expense.description}</td>
                <td>
                  <span
                    className="category-tag"
                    style={{
                      backgroundColor: getCategoryColor(expense.category),
                    }}
                  >
                    {expense.category}
                  </span>
                </td>
                <td>{expense.vendor}</td>
                <td>${expense.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ExpenseList;
