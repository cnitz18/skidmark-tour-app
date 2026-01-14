import { useState, useEffect, useCallback } from "react";
import { Container, Card, Form, Button, Alert, Spinner, Nav } from "react-bootstrap";
import PageHeader from "../shared/PageHeader";
import ScreenshotParser from "../ScreenshotParser";
import styles from "./AdminPortal.module.css";

const AdminPortal = ({ enums, lists }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessKey, setAccessKey] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Check if already authenticated in this session
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem("adminAuthenticated");
    if (sessionAuth === "true") {
      setIsAuthenticated(true);
    }
    setCheckingSession(false);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(
        process.env.REACT_APP_AMS2API + "/api/admin/verify-key/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ key: accessKey }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem("adminAuthenticated", "true");
      } else {
        setError(result.error || "Invalid access key");
      }
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [accessKey]);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("adminAuthenticated");
    setAccessKey("");
  }, []);

  // Show loading while checking session
  if (checkingSession) {
    return (
      <Container className={styles.container}>
        <div className={styles.loadingWrapper}>
          <Spinner animation="border" variant="warning" />
        </div>
      </Container>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <Container className={styles.container}>
        <div className={styles.loginWrapper}>
          <Card className={styles.loginCard}>
            <Card.Header className={styles.loginHeader}>
              <h4 className="mb-0">🔐 Admin Portal</h4>
            </Card.Header>
            <Card.Body>
              <p className={styles.loginDescription}>
                Enter your access key to continue.
              </p>
              
              {error && (
                <Alert variant="danger" className={styles.errorAlert}>
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label className={styles.formLabel}>Access Key</Form.Label>
                  <Form.Control
                    type="password"
                    className={styles.formControl}
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value)}
                    placeholder="Enter access key..."
                    autoFocus
                    disabled={isLoading}
                  />
                </Form.Group>
                <Button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isLoading || !accessKey.trim()}
                >
                  {isLoading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Verifying...
                    </>
                  ) : (
                    "Access Portal"
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </div>
      </Container>
    );
  }

  // Show admin portal content
  return (
    <div className={styles.adminContent}>
      <PageHeader 
        title="Admin Portal" 
        subtitle="Manage your racing league tools and data"
      />
      
      <Container className={styles.portalContainer}>
        {/* Tab Navigation */}
        <div className={styles.tabNav}>
          <Nav variant="tabs" className={styles.adminTabs}>
            <Nav.Item>
              <Nav.Link active className={styles.tabLink}>
                📥 Import Tool
              </Nav.Link>
            </Nav.Item>
            {/* Future tabs will go here */}
          </Nav>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={handleLogout}
            className={styles.logoutButton}
          >
            Logout
          </Button>
        </div>
        
        {/* Tab Content */}
        <div className={styles.tabContent}>
          <ScreenshotParser enums={enums} lists={lists} embedded={true} />
        </div>
      </Container>
    </div>
  );
};

export default AdminPortal;
