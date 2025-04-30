import React, { useState } from 'react';
import { Form, Button, Accordion } from 'react-bootstrap';

const FilterPanel = ({ categories, onFilter }) => {
  const [filters, setFilters] = useState({
    category: '',
    color: '',
    brand: '',
    minPrice: '',
    maxPrice: ''
  });

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter(filters);
  };

  const handleReset = () => {
    setFilters({
      category: '',
      color: '',
      brand: '',
      minPrice: '',
      maxPrice: ''
    });
    onFilter({});
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Accordion defaultActiveKey="0" alwaysOpen>
        <Accordion.Item eventKey="0">
          <Accordion.Header>Filters</Accordion.Header>
          <Accordion.Body>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select 
                name="category"
                value={filters.category}
                onChange={handleChange}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Color</Form.Label>
              <Form.Control
                type="text"
                name="color"
                placeholder="Search by color"
                value={filters.color}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Brand</Form.Label>
              <Form.Control
                type="text"
                name="brand"
                placeholder="Search by brand"
                value={filters.brand}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Price Range</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  type="number"
                  name="minPrice"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={handleChange}
                />
                <Form.Control
                  type="number"
                  name="maxPrice"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={handleChange}
                />
              </div>
            </Form.Group>

            <div className="d-grid gap-2">
              <Button variant="primary" type="submit">
                Apply Filters
              </Button>
              <Button variant="outline-secondary" onClick={handleReset}>
                Reset Filters
              </Button>
            </div>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </Form>
  );
};

export default FilterPanel;