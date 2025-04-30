import React from 'react';
import { Row, Col } from 'react-bootstrap';
import MaterialCard from './MaterialsCard';

const MaterialGrid = ({ materials, onAddToProject }) => {
  return (
    <Row xs={1} md={2} lg={3} xl={4} className="g-4">
      {materials.map((material) => (
        <Col key={material._id}>
          <MaterialCard 
            material={material} 
            onAddToProject={onAddToProject} 
          />
        </Col>
      ))}
    </Row>
  );
};

export default MaterialGrid;