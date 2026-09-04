import { useState, useCallback, useEffect } from "react";
import { Card, Button, Table, Spinner, Alert, Badge } from "react-bootstrap";
import styles from "./CacheManager.module.css";

const API_BASE = process.env.REACT_APP_AMS2API;

const getAdminHeaders = () => ({
  'X-Admin-Key': sessionStorage.getItem("adminKey") || "",
  'Content-Type': 'application/json'
});

const formatExpiry = (seconds) => {
  if (seconds === null || seconds === undefined) return '—';
  if (seconds <= 0) return 'expired';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
};

const CacheManager = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/batchupload/cache/keys/`, {
        headers: getAdminHeaders()
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch cache keys (${response.status})`);
      }
      const data = await response.json();
      setEntries(data.details || []);
      setLastFetched(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleClearCache = useCallback(async () => {
    if (!window.confirm(`Clear all ${entries.length} cached entries? This cannot be undone.`)) {
      return;
    }
    setClearing(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/batchupload/cache/clear/`, {
        method: 'POST',
        headers: getAdminHeaders()
      });
      if (!response.ok) {
        throw new Error(`Failed to clear cache (${response.status})`);
      }
      await fetchKeys();
    } catch (err) {
      setError(err.message);
    } finally {
      setClearing(false);
    }
  }, [entries.length, fetchKeys]);

  return (
    <div className={styles.cacheManager}>
      <Card className="mb-3">
        <Card.Body className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <Card.Title className="mb-1">Cache Contents</Card.Title>
            <Card.Text className="text-muted mb-0">
              <Badge bg="secondary" className="me-2">{entries.length} keys</Badge>
              {lastFetched && `Last refreshed ${lastFetched.toLocaleTimeString()}`}
            </Card.Text>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" size="sm" onClick={fetchKeys} disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : 'Refresh'}
            </Button>
            <Button variant="danger" size="sm" onClick={handleClearCache} disabled={clearing || entries.length === 0}>
              {clearing ? <Spinner animation="border" size="sm" /> : 'Clear Cache'}
            </Button>
          </div>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      {entries.length > 0 ? (
        <Table striped hover responsive size="sm" className={styles.cacheTable}>
          <thead>
            <tr>
              <th>Key</th>
              <th>Expires in</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.key}>
                <td className={styles.keyCell}>{entry.key}</td>
                <td>{formatExpiry(entry.expires_in_seconds)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        !loading && <Alert variant="info">Cache is empty.</Alert>
      )}
    </div>
  );
};

export default CacheManager;
