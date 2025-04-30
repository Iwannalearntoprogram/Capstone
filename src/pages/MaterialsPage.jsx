import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import MaterialGrid from '../components/MaterialGrid';
import FilterPanel from '../components/FilterPanel';

const MaterialsPage = () => {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await axios.get('/api/materials');
        setMaterials(res.data);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(res.data.map(m => m.category))];
        setCategories(uniqueCategories);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Error fetching materials');
        setLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  const handleFilter = async (filters) => {
    try {
      const params = new URLSearchParams();
      for (const key in filters) {
        if (filters[key]) params.append(key, filters[key]);
      }
      
      const res = await axios.get(`/api/materials?${params.toString()}`);
      setMaterials(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error filtering materials');
    }
  };

  const handleAddToProject = (material) => {
    console.log('Added to project:', material);
    // Implement project addition logic
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Container fluid>
      <Row>
        <Col md={3} lg={2} className="p-3">
          <FilterPanel categories={categories} onFilter={handleFilter} />
        </Col>
        <Col md={9} lg={10} className="p-3">
          <h2 className="mb-4">Materials Library</h2>
          <MaterialGrid 
            materials={materials} 
            onAddToProject={handleAddToProject} 
          />
        </Col>
      </Row>
    </Container>
  );
};

export default MaterialsPage;