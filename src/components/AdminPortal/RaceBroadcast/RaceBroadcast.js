import { useState, useEffect, useCallback } from "react";
import { Card, Button, Form, Spinner, Alert, Table, Badge } from "react-bootstrap";
import styles from "./RaceBroadcast.module.css";

const API_BASE = process.env.REACT_APP_AMS2API;
const BOT_API = process.env.REACT_APP_BOT_SERVER_URL;
const BOT_TOKEN = process.env.REACT_APP_BOT_SERVER_TOKEN;

const RaceBroadcast = () => {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRace, setSelectedRace] = useState(null);
  const [withLeague, setWithLeague] = useState(true);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);

  // Fetch recent races
  const fetchRaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const adminKey = sessionStorage.getItem("adminKey") || "";
      const response = await fetch(`${API_BASE}/api/admin/recent-races/?limit=15`, {
        headers: { 'X-Admin-Key': adminKey }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch races');
      }
      
      const data = await response.json();
      setRaces(data.races || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRaces();
  }, [fetchRaces]);

  // Handle race selection
  const handleSelectRace = useCallback((race) => {
    setSelectedRace(race);
    setWithLeague(race.league_id !== null);
    setBroadcastResult(null);
  }, []);

  // Broadcast race summary
  const handleBroadcast = useCallback(async () => {
    if (!selectedRace) return;
    
    setBroadcasting(true);
    setBroadcastResult(null);
    
    try {
      const url = `${BOT_API}/racesummary/${selectedRace.id}/${withLeague ? '?with-league=true' : ''}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'X-API-KEY': BOT_TOKEN }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to broadcast: ${response.status}`);
      }
      
      setBroadcastResult({ success: true, message: 'Race summary sent to Discord!' });
    } catch (err) {
      setBroadcastResult({ success: false, message: err.message });
    } finally {
      setBroadcasting(false);
    }
  }, [selectedRace, withLeague]);

  return (
    <div className={styles.broadcast}>
      <Card className={styles.card}>
        <Card.Header className={styles.cardHeader}>
          <span>📡 Race Summary Broadcast</span>
          <Button variant="outline-primary" size="sm" onClick={fetchRaces} disabled={loading}>
            {loading ? <Spinner size="sm" /> : 'Refresh'}
          </Button>
        </Card.Header>
        <Card.Body>
          <p className={styles.description}>
            Select a recent race to broadcast its summary to the Discord channel.
          </p>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          {loading ? (
            <div className={styles.loadingContainer}>
              <Spinner />
              <span>Loading races...</span>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <Table hover size="sm" className={styles.raceTable}>
                <thead>
                  <tr>
                    <th></th>
                    <th>Date</th>
                    <th>Track</th>
                    <th>Class</th>
                    <th>League</th>
                  </tr>
                </thead>
                <tbody>
                  {races.map((race) => (
                    <tr 
                      key={race.id}
                      className={`${styles.raceRow} ${selectedRace?.id === race.id ? styles.selected : ''}`}
                      onClick={() => handleSelectRace(race)}
                    >
                      <td>
                        <Form.Check 
                          type="radio"
                          checked={selectedRace?.id === race.id}
                          onChange={() => handleSelectRace(race)}
                          className={styles.radioCheck}
                        />
                      </td>
                      <td>{race.end_time_formatted}</td>
                      <td>{race.track_name}</td>
                      <td>{race.vehicle_class_name}</td>
                      <td>
                        {race.league_name ? (
                          <Badge bg="primary">{race.league_name}</Badge>
                        ) : (
                          <span className={styles.noLeague}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
          
          {selectedRace && (
            <div className={styles.broadcastControls}>
              <div className={styles.selectedInfo}>
                <strong>Selected:</strong> {selectedRace.track_name} ({selectedRace.end_time_formatted})
              </div>
              
              <div className={styles.optionsRow}>
                <Form.Check
                  type="switch"
                  id="with-league-switch"
                  label="Include league standings summary"
                  checked={withLeague}
                  onChange={(e) => setWithLeague(e.target.checked)}
                  disabled={!selectedRace.league_id}
                  className={styles.leagueSwitch}
                />
                
                <Button 
                  variant="success"
                  onClick={handleBroadcast}
                  disabled={broadcasting}
                  className={styles.broadcastButton}
                >
                  {broadcasting ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Broadcasting...
                    </>
                  ) : (
                    '📢 Broadcast to Discord'
                  )}
                </Button>
              </div>
              
              {!selectedRace.league_id && (
                <small className="text-muted">
                  This race is not affiliated with a league. League summary option disabled.
                </small>
              )}
            </div>
          )}
          
          {broadcastResult && (
            <Alert 
              variant={broadcastResult.success ? 'success' : 'danger'} 
              className={styles.resultAlert}
            >
              {broadcastResult.message}
            </Alert>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default RaceBroadcast;
