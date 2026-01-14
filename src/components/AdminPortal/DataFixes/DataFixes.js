import { useState, useEffect, useCallback, useRef } from "react";
import { Row, Col, Card, Button, Form, Spinner, Alert, Nav } from "react-bootstrap";
import styles from "./DataFixes.module.css";

const API_BASE = process.env.REACT_APP_AMS2API;

const DataFixes = ({ recentRaces = [], racesLoading = false, onRefreshRaces }) => {
  const [activeTab, setActiveTab] = useState('leagues');
  
  // League recalculation state
  const [activeLeagues, setActiveLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [leagueLogs, setLeagueLogs] = useState([]);
  const [leagueRunning, setLeagueRunning] = useState(false);
  
  // Fastest laps state
  const [fastestLapMode, setFastestLapMode] = useState('all');
  const [selectedRaceId, setSelectedRaceId] = useState('');
  const [fastestLapLogs, setFastestLapLogs] = useState([]);
  const [fastestLapRunning, setFastestLapRunning] = useState(false);
  
  // Refs for auto-scroll
  const leagueLogsRef = useRef(null);
  const fastestLapLogsRef = useRef(null);

  const getAdminHeaders = () => ({
    'X-Admin-Key': sessionStorage.getItem("adminKey") || "",
    'Content-Type': 'application/json'
  });

  // Fetch active leagues
  const fetchActiveLeagues = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/active-leagues/`, {
        headers: getAdminHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setActiveLeagues(data.leagues || []);
      }
    } catch (err) {
      console.error('Failed to fetch leagues:', err);
    }
  }, []);

  useEffect(() => {
    fetchActiveLeagues();
  }, [fetchActiveLeagues]);

  // Auto-scroll logs
  useEffect(() => {
    leagueLogsRef.current?.scrollTo({ top: leagueLogsRef.current.scrollHeight, behavior: 'smooth' });
  }, [leagueLogs]);

  useEffect(() => {
    fastestLapLogsRef.current?.scrollTo({ top: fastestLapLogsRef.current.scrollHeight, behavior: 'smooth' });
  }, [fastestLapLogs]);

  // Run league recalculation
  const handleRecalculateLeagues = useCallback(async () => {
    setLeagueLogs([]);
    setLeagueRunning(true);
    
    try {
      const endpoint = selectedLeague === 'all' 
        ? `${API_BASE}/api/admin/recalculate-leagues/`
        : `${API_BASE}/api/admin/recalculate-league/`;
      
      const options = {
        method: 'POST',
        headers: getAdminHeaders(),
      };
      
      if (selectedLeague !== 'all') {
        options.body = JSON.stringify({ league_id: parseInt(selectedLeague) });
      }
      
      const response = await fetch(endpoint, options);
      
      if (selectedLeague === 'all') {
        // Streaming response for all leagues
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const text = decoder.decode(value);
          const lines = text.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.log) {
                setLeagueLogs(prev => [...prev, data.log]);
              }
              if (data.complete) {
                setLeagueRunning(false);
              }
            } catch (e) {
              // Skip non-JSON lines
            }
          }
        }
      } else {
        // Single league response
        const data = await response.json();
        if (data.success) {
          setLeagueLogs([`✓ Successfully updated: ${data.league_name}`]);
        } else {
          setLeagueLogs([`✗ Error: ${data.error}`]);
        }
        setLeagueRunning(false);
      }
    } catch (err) {
      setLeagueLogs(prev => [...prev, `Error: ${err.message}`]);
      setLeagueRunning(false);
    }
  }, [selectedLeague]);

  // Run fastest lap update
  const handleUpdateFastestLaps = useCallback(async () => {
    setFastestLapLogs([]);
    setFastestLapRunning(true);
    
    try {
      if (fastestLapMode === 'all') {
        // Streaming response for all stages
        const response = await fetch(`${API_BASE}/api/admin/update-fastest-laps/`, {
          method: 'POST',
          headers: getAdminHeaders(),
        });
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const text = decoder.decode(value);
          const lines = text.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.log) {
                setFastestLapLogs(prev => [...prev, data.log]);
              }
              if (data.complete) {
                setFastestLapRunning(false);
              }
            } catch (e) {
              // Skip non-JSON lines
            }
          }
        }
      } else {
        // Single race update
        if (!selectedRaceId) {
          setFastestLapLogs(['Error: Please select a race']);
          setFastestLapRunning(false);
          return;
        }
        
        const response = await fetch(`${API_BASE}/api/admin/update-fastest-lap-race/`, {
          method: 'POST',
          headers: getAdminHeaders(),
          body: JSON.stringify({ race_id: parseInt(selectedRaceId) })
        });
        
        const data = await response.json();
        if (data.success) {
          setFastestLapLogs([
            `✓ Updated ${data.updated_stages.length} stage(s)`,
            ...data.updated_stages.map(id => `  - Stage ${id}`),
            ...(data.errors.length > 0 ? data.errors.map(e => `✗ ${e.error}`) : [])
          ]);
        } else {
          setFastestLapLogs([`✗ Error: ${data.error}`]);
        }
        setFastestLapRunning(false);
      }
    } catch (err) {
      setFastestLapLogs(prev => [...prev, `Error: ${err.message}`]);
      setFastestLapRunning(false);
    }
  }, [fastestLapMode, selectedRaceId]);

  return (
    <div className={styles.dataFixes}>
      {/* Sub-navigation */}
      <Nav variant="pills" className={styles.subNav}>
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'leagues'} 
            onClick={() => setActiveTab('leagues')}
            className={styles.subNavLink}
          >
            🏆 League Stats
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'fastestlaps'} 
            onClick={() => setActiveTab('fastestlaps')}
            className={styles.subNavLink}
          >
            ⚡ Fastest Laps
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {/* League Recalculation Tab */}
      {activeTab === 'leagues' && (
        <Card className={styles.card}>
          <Card.Header className={styles.cardHeader}>
            🏆 Recalculate League Standings
          </Card.Header>
          <Card.Body>
            <p className={styles.description}>
              Trigger a recalculation of league standings. Use this when race results 
              weren't properly picked up by the import watcher.
            </p>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className={styles.formLabel}>Select League</Form.Label>
                  <Form.Select 
                    value={selectedLeague}
                    onChange={(e) => setSelectedLeague(e.target.value)}
                    disabled={leagueRunning}
                    className={styles.formControl}
                  >
                    <option value="all">All Active Leagues</option>
                    {activeLeagues.map(league => (
                      <option key={league.id} value={league.id}>
                        {league.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6} className="d-flex align-items-end">
                <Button 
                  variant="primary"
                  onClick={handleRecalculateLeagues}
                  disabled={leagueRunning}
                  className={styles.actionButton}
                >
                  {leagueRunning ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Processing...
                    </>
                  ) : (
                    '🔄 Run Recalculation'
                  )}
                </Button>
              </Col>
            </Row>
            
            {leagueLogs.length > 0 && (
              <div className={styles.logsContainer} ref={leagueLogsRef}>
                {leagueLogs.map((log, idx) => (
                  <div key={idx} className={styles.logEntry}>{log}</div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Fastest Laps Tab */}
      {activeTab === 'fastestlaps' && (
        <Card className={styles.card}>
          <Card.Header className={styles.cardHeader}>
            ⚡ Update Fastest Lap Records
          </Card.Header>
          <Card.Body>
            <p className={styles.description}>
              Recalculate which driver had the fastest lap in each stage. 
              Run for all races or specify a single race ID.
            </p>
            
            <Row className="mb-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className={styles.formLabel}>Update Mode</Form.Label>
                  <Form.Select 
                    value={fastestLapMode}
                    onChange={(e) => setFastestLapMode(e.target.value)}
                    disabled={fastestLapRunning}
                    className={styles.formControl}
                  >
                    <option value="all">All Races (takes a while)</option>
                    <option value="single">Single Race</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              {fastestLapMode === 'single' && (
                <Col md={5}>
                  <Form.Group>
                    <Form.Label className={styles.formLabel}>
                      Select Race
                      {racesLoading && <Spinner size="sm" className="ms-2" />}
                    </Form.Label>
                    <Form.Select 
                      value={selectedRaceId}
                      onChange={(e) => setSelectedRaceId(e.target.value)}
                      disabled={fastestLapRunning || racesLoading}
                      className={styles.formControl}
                    >
                      <option value="">Choose a recent race...</option>
                      {recentRaces.map(race => (
                        <option key={race.id} value={race.id}>
                          #{race.id} - {race.track_name} ({race.vehicle_class_name}) - {race.end_time_formatted}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      <Button 
                        variant="link" 
                        size="sm" 
                        onClick={onRefreshRaces} 
                        disabled={racesLoading}
                        className="p-0"
                      >
                        Refresh list
                      </Button>
                    </Form.Text>
                  </Form.Group>
                </Col>
              )}
              <Col md={fastestLapMode === 'single' ? 3 : 8} className="d-flex align-items-end">
                <Button 
                  variant="primary"
                  onClick={handleUpdateFastestLaps}
                  disabled={fastestLapRunning}
                  className={styles.actionButton}
                >
                  {fastestLapRunning ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Processing...
                    </>
                  ) : (
                    '⚡ Update Fastest Laps'
                  )}
                </Button>
              </Col>
            </Row>
            
            {fastestLapMode === 'all' && (
              <Alert variant="warning" className={styles.warningAlert}>
                <strong>Warning:</strong> Updating all races can take several minutes. 
                The page will show progress as it runs.
              </Alert>
            )}
            
            {fastestLapLogs.length > 0 && (
              <div className={styles.logsContainer} ref={fastestLapLogsRef}>
                {fastestLapLogs.map((log, idx) => (
                  <div key={idx} className={styles.logEntry}>{log}</div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default DataFixes;
