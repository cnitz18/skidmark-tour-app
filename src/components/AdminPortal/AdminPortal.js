import { useState, useEffect, useCallback } from "react";
import { Container, Card, Form, Button, Alert, Spinner, Nav } from "react-bootstrap";
import PageHeader from "../shared/PageHeader";
import ScreenshotParser from "../ScreenshotParser";
import ChorleyConsole from "./ChorleyConsole";
import DataFixes from "./DataFixes";
import styles from "./AdminPortal.module.css";

const API_BASE = process.env.REACT_APP_AMS2API;

const AdminPortal = ({ enums, lists }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessKey, setAccessKey] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeTab, setActiveTab] = useState('import');
  
  // Shared recent races data - fetched once and passed to child components
  const [recentRaces, setRecentRaces] = useState([]);
  const [racesLoading, setRacesLoading] = useState(false);
  const [racesError, setRacesError] = useState(null);

  // Fetch recent races (shared data for ChorleyConsole and DataFixes)
  const fetchRecentRaces = useCallback(async () => {
    setRacesLoading(true);
    setRacesError(null);
    try {
      const adminKey = sessionStorage.getItem("adminKey") || "";
      const response = await fetch(`${API_BASE}/api/admin/recent-races/?limit=25`, {
        headers: { 'X-Admin-Key': adminKey }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch races');
      }
      
      const data = await response.json();
      setRecentRaces(data.races || []);
    } catch (err) {
      setRacesError(err.message);
    } finally {
      setRacesLoading(false);
    }
  }, []);

  // Check if already authenticated in this session
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem("adminAuthenticated");
    const adminKey = sessionStorage.getItem("adminKey");
    // Only restore session if both auth flag AND key are present
    if (sessionAuth === "true" && adminKey) {
      setIsAuthenticated(true);
    } else {
      // Clear incomplete session state
      sessionStorage.removeItem("adminAuthenticated");
      sessionStorage.removeItem("adminKey");
    }
    setCheckingSession(false);
  }, []);

  // Fetch recent races once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchRecentRaces();
    }
  }, [isAuthenticated, fetchRecentRaces]);

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
        sessionStorage.setItem("adminKey", accessKey);
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
    sessionStorage.removeItem("adminKey");
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
              <Nav.Link 
                active={activeTab === 'import'} 
                className={styles.tabLink}
                onClick={() => setActiveTab('import')}
              >
                📥 Import Tool
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'datafixes'} 
                className={styles.tabLink}
                onClick={() => setActiveTab('datafixes')}
              >
                🔧 Data Fixes
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                active={activeTab === 'chorley'} 
                className={styles.tabLink}
                onClick={() => setActiveTab('chorley')}
              >
                🤖 Chorley Bot
              </Nav.Link>
            </Nav.Item>
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
          {activeTab === 'import' && (
            <ScreenshotParser enums={enums} lists={lists} embedded={true} />
          )}
          {activeTab === 'datafixes' && (
            <DataFixes 
              recentRaces={recentRaces}
              racesLoading={racesLoading}
              onRefreshRaces={fetchRecentRaces}
            />
          )}
          {activeTab === 'chorley' && (
            <ChorleyConsole 
              recentRaces={recentRaces}
              racesLoading={racesLoading}
              racesError={racesError}
              onRefreshRaces={fetchRecentRaces}
            />
          )}
        </div>
      </Container>
    </div>
  );
};

export default AdminPortal;
