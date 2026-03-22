import React, { useState, useContext } from "react";
import { BudgetContext } from "../context/BudgetContext";
import DatePicker from "react-datepicker";
import {
  validateFile,
  validatePositiveNumber,
  validateRequiredText,
} from "../utils/validation";
// import 'react-datepicker/dist/react-datepicker.css';

const ExpenseForm = () => {
  const { activeProject, addExpense } = useContext(BudgetContext);
  const [expense, setExpense] = useState({
    projectId: activeProject,
    description: "",
    amount: "",
    category: "materials",
    vendor: "",
    date: new Date(),
    receipt: null,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setExpense((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({
      ...prev,
      [name]:
        name === "description"
          ? validateRequiredText(value, "Description")
          : name === "amount"
          ? validatePositiveNumber(value, "Amount")
          : "",
    }));
  };

  const handleDateChange = (date) => {
    setExpense((prev) => ({ ...prev, date }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setExpense((prev) => ({ ...prev, receipt: file }));
    setErrors((prev) => ({
      ...prev,
      receipt: file
        ? validateFile(file, {
            label: "Receipt",
            allowedMimePrefixes: ["image/"],
            allowedMimeTypes: ["application/pdf"],
            maxSizeMb: 10,
          })
        : "",
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {
      description: validateRequiredText(expense.description, "Description"),
      amount: validatePositiveNumber(expense.amount, "Amount"),
      receipt: expense.receipt
        ? validateFile(expense.receipt, {
            label: "Receipt",
            allowedMimePrefixes: ["image/"],
            allowedMimeTypes: ["application/pdf"],
            maxSizeMb: 10,
          })
        : "",
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    const newExpense = {
      ...expense,
      id: Date.now(),
      amount: parseFloat(expense.amount),
    };
    addExpense(newExpense);
    // Reset form
    setExpense({
      projectId: activeProject,
      description: "",
      amount: "",
      category: "materials",
      vendor: "",
      date: new Date(),
      receipt: null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="expense-form">
      <h3>Add New Expense</h3>

      <div className="form-group">
        <label>Description</label>
        <input
          type="text"
          name="description"
          value={expense.description}
          onChange={handleChange}
          required
        />
        {errors.description && (
          <p className="text-red-500 text-sm">{errors.description}</p>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Amount ($)</label>
          <input
            type="number"
            name="amount"
            value={expense.amount}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
          />
          {errors.amount && (
            <p className="text-red-500 text-sm">{errors.amount}</p>
          )}
        </div>

        <div className="form-group">
          <label>Category</label>
          <select
            name="category"
            value={expense.category}
            onChange={handleChange}
          >
            <option value="materials">Materials</option>
            <option value="labor">Labor</option>
            <option value="subcontractors">Subcontractors</option>
            <option value="furniture">Furniture</option>
            <option value="fixtures">Fixtures</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Vendor</label>
          <input
            type="text"
            name="vendor"
            value={expense.vendor}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Date</label>
          <DatePicker
            selected={expense.date}
            onChange={handleDateChange}
            dateFormat="MM/dd/yyyy"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Receipt (optional)</label>
        <input type="file" accept="image/*,.pdf" onChange={handleFileChange} />
        {errors.receipt && (
          <p className="text-red-500 text-sm">{errors.receipt}</p>
        )}
      </div>

      <button type="submit" className="submit-btn">
        Add Expense
      </button>
    </form>
  );
};

export default ExpenseForm;
