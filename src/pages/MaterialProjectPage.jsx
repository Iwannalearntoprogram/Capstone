import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Alert, 
  Badge,
  Spinner,
  ButtonGroup
} from 'react-bootstrap';
import axios from 'axios';
import MaterialsProjectSelector from '../components/MaterialsProjectSelector';

const MaterialsProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('materials');

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!projectId) return;
      
      try {
        setLoading(true);
        const [projectRes, materialsRes] = await Promise.all([
          axios.get(`/api/projects/${projectId}`),
          axios.get(`/api/projects/${projectId}/materials`)
        ]);
        
        setProject(projectRes.data);
        setMaterials(materialsRes.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load project data');
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [projectId]);

  const handleRemoveMaterial = async (materialId) => {
    try {
      await axios.delete(`/api/projects/${projectId}/materials/${materialId}`);
      setMaterials(prev => prev.filter(m => m._id !== materialId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove material');
    }
  };

  const handleAddMaterials = () => {
    navigate(`/materials?projectId=${projectId}`);
  };

  const renderStatusBadge = (status) => {
    const variants = {
      planning: 'secondary',
      'in-progress': 'primary',
      completed: 'success',
      'on-hold': 'warning'
    };
    return <Badge bg={variants[status]}>{status}</Badge>;
  };

  if (loading) return (
    <Container className="text-center my-5">
      <Spinner animation="border" />
      <p>Loading project data...</p>
    </Container>
  );

  if (error) return (
    <Container>
      <Alert variant="danger">{error}</Alert>
      <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
    </Container>
  );

  if (!project) return (
    <Container>
      <Alert variant="warning">Project not found</Alert>
      <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
    </Container>
  );

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">{project.name}</h2>
              <p className="text-muted mb-0">
                {project.client && `Client: ${project.client} • `}
                {renderStatusBadge(project.status)}
              </p>
            </div>
            <ButtonGroup>
              <Button 
                variant="outline-primary"
                onClick={() => navigate(`/projects/edit/${projectId}`)}
              >
                Edit Project
              </Button>
              <Button 
                variant="primary"
                onClick={handleAddMaterials}
              >
                Add Materials
              </Button>
            </ButtonGroup>
          </div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <div className="d-flex border-bottom">
            <Button 
              variant="link"
              className={`me-3 ${activeTab === 'materials' ? 'text-decoration-underline' : ''}`}
              onClick={() => setActiveTab('materials')}
            >
              Materials
            </Button>
            <Button 
              variant="link"
              className={`me-3 ${activeTab === 'details' ? 'text-decoration-underline' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              Project Details
            </Button>
          </div>
        </Col>
      </Row>

      {activeTab === 'materials' ? (
        <>
          {materials.length === 0 ? (
            <Alert variant="info" className="text-center">
              No materials added to this project yet.
              <Button 
                variant="link" 
                className="p-0 ms-2"
                onClick={handleAddMaterials}
              >
                Add materials now
              </Button>
            </Alert>
          ) : (
            <Row xs={1} md={2} lg={3} xl={4} className="g-4">
              {materials.map(material => (
                <Col key={material._id}>
                  <Card className="h-100">
                    <Card.Img 
                      variant="top" 
                      src={material.imageUrl} 
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                    <Card.Body className="d-flex flex-column">
                      <Card.Title>{material.name}</Card.Title>
                      <Card.Subtitle className="mb-2 text-muted">
                        {material.brand}
                      </Card.Subtitle>
                      <div className="mb-2">
                        <Badge bg="light" text="dark" className="me-1">
                          {material.color}
                        </Badge>
                        <Badge bg="light" text="dark">
                          {material.category}
                        </Badge>
                      </div>
                      <Card.Text className="flex-grow-1">
                        <strong>Price:</strong> ${material.pricePerUnit}/{material.unitType}
                      </Card.Text>
                      <Button 
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleRemoveMaterial(material._id)}
                      >
                        Remove from Project
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </>
      ) : (
        <Row>
          <Col md={6}>
            <Card className="mb-4">
              <Card.Body>
                <Card.Title>Project Details</Card.Title>
                <Card.Text>
                  <strong>Description:</strong> {project.description || 'None provided'}
                </Card.Text>
                <Card.Text>
                  <strong>Location:</strong> {project.location || 'Not specified'}
                </Card.Text>
                <Card.Text>
                  <strong>Status:</strong> {renderStatusBadge(project.status)}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card>
              <Card.Body>
                <Card.Title>Project Timeline</Card.Title>
                <Card.Text>
                  <strong>Start Date:</strong> {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
                </Card.Text>
                <Card.Text>
                  <strong>End Date:</strong> {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
                </Card.Text>
                <Card.Text>
                  <strong>Budget:</strong> {project.budget ? `$${project.budget.toLocaleString()}` : 'Not specified'}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default MaterialsProjectPage;