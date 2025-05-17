import React, { useContext, useState } from "react";
import { BudgetContext } from "../context/BudgetContext";

const VendorList = () => {
  const { vendors, addVendor } = useContext(BudgetContext);
  const [newVendor, setNewVendor] = useState({
    name: "",
    contact: "",
    specialty: "",
    notes: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewVendor((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newVendor.name) return;

    const vendorToAdd = {
      ...newVendor,
      id: Date.now(),
    };

    addVendor(vendorToAdd);
    setNewVendor({
      name: "",
      contact: "",
      specialty: "",
      notes: "",
    });
  };

  return (
    <div className="vendor-list">
      <h3>Vendor Directory</h3>

      <form onSubmit={handleSubmit} className="vendor-form">
        <div className="form-row">
          <div className="form-group">
            <input
              type="text"
              name="name"
              value={newVendor.name}
              onChange={handleInputChange}
              placeholder="Vendor Name"
              required
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              name="contact"
              value={newVendor.contact}
              onChange={handleInputChange}
              placeholder="Contact Info"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <input
              type="text"
              name="specialty"
              value={newVendor.specialty}
              onChange={handleInputChange}
              placeholder="Specialty (e.g., flooring, lighting)"
            />
          </div>
          <button type="submit" className="add-vendor-btn">
            Add Vendor
          </button>
        </div>

        <div className="form-group">
          <textarea
            name="notes"
            value={newVendor.notes}
            onChange={handleInputChange}
            placeholder="Additional notes"
            rows="2"
          />
        </div>
      </form>

      {vendors.length > 0 ? (
        <div className="vendors-grid">
          {vendors.map((vendor) => (
            <div key={vendor.id} className="vendor-card">
              <h4>{vendor.name}</h4>
              {vendor.contact && (
                <p>
                  <strong>Contact:</strong> {vendor.contact}
                </p>
              )}
              {vendor.specialty && (
                <p>
                  <strong>Specialty:</strong> {vendor.specialty}
                </p>
              )}
              {vendor.notes && <p className="vendor-notes">{vendor.notes}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p>No vendors added yet.</p>
      )}
    </div>
  );
};

export default VendorList;
