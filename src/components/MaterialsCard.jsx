import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';

const MaterialCard = ({ material, onAddToProject }) => {
  return (
    <Card className="h-100 material-card">
      <Card.Img variant="top" src={material.imageUrl} alt={material.name} />
      <Card.Body>
        <Card.Title>{material.name}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">{material.brand}</Card.Subtitle>
        
        <div className="mb-2">
          <Badge bg="light" text="dark" className="me-1">{material.color}</Badge>
          <Badge bg="light" text="dark" className="me-1">{material.category}</Badge>
          {material.sustainabilityRating && (
            <Badge bg="success">Eco: {material.sustainabilityRating}/5</Badge>
          )}
        </div>
        
        <div className="specs mb-3">
          <p><strong>Size:</strong> {material.size?.width}x{material.size?.height}x{material.size?.depth}{material.size?.unit}</p>
          <p><strong>Price:</strong> ${material.pricePerUnit} / {material.unitType}</p>
          {material.fireRating && <p><strong>Fire Rating:</strong> {material.fireRating}</p>}
        </div>
        
        <Button 
          variant="primary" 
          onClick={() => onAddToProject(material)}
          className="w-100"
        >
          Add to Project
        </Button>
      </Card.Body>
    </Card>
  );
};

export default MaterialCard;