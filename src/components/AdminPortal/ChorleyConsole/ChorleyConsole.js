import { useState, useEffect, useCallback, useRef } from "react";
import { Row, Col, Card, Button, Form, Spinner, Badge, Nav, Alert, Table } from "react-bootstrap";
import styles from "./ChorleyConsole.module.css";

const CHORLEY_API = process.env.REACT_APP_BOT_SERVER_URL || 'http://localhost:3001';
const BOT_TOKEN = process.env.REACT_APP_BOT_SERVER_TOKEN || '';

const getHeaders = (includeContentType = false) => {
  const headers = { 'X-API-KEY': BOT_TOKEN };
  if (includeContentType) headers['Content-Type'] = 'application/json';
  return headers;
};

const ChorleyConsole = ({ recentRaces = [], racesLoading = false, racesError = null, onRefreshRaces }) => {
  const [activeTab, setActiveTab] = useState('status');
  
  // Status state
  const [status, setStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState(null);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Logs state
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const logsEndRef = useRef(null);
  
  // Broadcast state
  const [selectedRace, setSelectedRace] = useState(null);
  const [withLeague, setWithLeague] = useState(true);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);

  // Fetch status
  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const response = await fetch(`${CHORLEY_API}/status`, { headers: getHeaders() });
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setStatusError(err.message);
      setStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const response = await fetch(`${CHORLEY_API}/console/logs`, { headers: getHeaders() });
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Fetch logs when tab changes to logs
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, fetchLogs]);

  // Auto-refresh status every 30 seconds
  useEffect(() => {
    if (activeTab === 'status') {
      const interval = setInterval(fetchStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchStatus]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Send chat message
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: new Date() }]);

    try {
      const response = await fetch(`${CHORLEY_API}/console/chat`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify({ message: userMessage, username: 'Admin' })
      });

      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      
      // Add Chorley's response
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response, 
        timestamp: new Date(),
        functionsCalled: data.functionsCalled || []
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'error', 
        content: `Error: ${err.message}`, 
        timestamp: new Date() 
      }]);
    } finally {
      setIsSending(false);
    }
  }, [inputMessage, isSending]);

  // Reset conversation
  const handleResetConversation = useCallback(async () => {
    try {
      await fetch(`${CHORLEY_API}/console/reset`, { method: 'POST', headers: getHeaders() });
      setMessages([]);
    } catch (err) {
      console.error('Failed to reset conversation:', err);
    }
  }, []);

  // Test model health
  const handleTestModel = useCallback(async () => {
    setStatusLoading(true);
    try {
      const response = await fetch(`${CHORLEY_API}/status/test-model`, { method: 'POST', headers: getHeaders() });
      const data = await response.json();
      setStatus(prev => ({ ...prev, modelTest: data }));
    } catch (err) {
      setStatusError('Model test failed: ' + err.message);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  // Handle race selection for broadcast
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
      const url = `${CHORLEY_API}/racesummary/${selectedRace.id}/${withLeague ? '?with-league=true' : ''}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: getHeaders()
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

  // Format uptime
  const formatUptime = (seconds) => {
    if (!seconds) return 'Unknown';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // Format timestamp
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className={styles.console}>
      {/* Sub-navigation */}
      <Nav variant="pills" className={styles.subNav}>
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'status'} 
            onClick={() => setActiveTab('status')}
            className={styles.subNavLink}
          >
            📊 Status
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'broadcast'} 
            onClick={() => setActiveTab('broadcast')}
            className={styles.subNavLink}
          >
            📡 Broadcast
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')}
            className={styles.subNavLink}
          >
            💬 Chat
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'logs'} 
            onClick={() => setActiveTab('logs')}
            className={styles.subNavLink}
          >
            📜 Logs
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {/* Status Tab */}
      {activeTab === 'status' && (
        <div className={styles.statusPanel}>
          <Row>
            <Col md={6} lg={4}>
              <Card className={styles.statusCard}>
                <Card.Body>
                  <div className={styles.statusHeader}>
                    <span>Bot Status</span>
                    <Button variant="link" size="sm" onClick={fetchStatus} disabled={statusLoading}>
                      {statusLoading ? <Spinner size="sm" /> : '🔄'}
                    </Button>
                  </div>
                  {statusError ? (
                    <div className={styles.statusOffline}>
                      <span className={styles.statusDot + ' ' + styles.offline}></span>
                      <span>Offline</span>
                    </div>
                  ) : status ? (
                    <div className={styles.statusOnline}>
                      <span className={styles.statusDot + ' ' + styles.online}></span>
                      <span>Online</span>
                    </div>
                  ) : (
                    <Spinner size="sm" />
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className={styles.statusCard}>
                <Card.Body>
                  <div className={styles.statusHeader}>
                    <span>Uptime</span>
                  </div>
                  <div className={styles.statusValue}>
                    {status?.uptime ? formatUptime(status.uptime) : '—'}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className={styles.statusCard}>
                <Card.Body>
                  <div className={styles.statusHeader}>
                    <span>Environment</span>
                  </div>
                  <div className={styles.statusValue}>
                    <Badge bg={status?.environment === 'production' ? 'success' : 'warning'}>
                      {status?.environment || '—'}
                    </Badge>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className={styles.statusCard}>
                <Card.Body>
                  <div className={styles.statusHeader}>
                    <span>Gemini Model</span>
                  </div>
                  <div className={styles.statusValue}>
                    {status?.model || '—'}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className={styles.statusCard}>
                <Card.Body>
                  <div className={styles.statusHeader}>
                    <span>Discord Connected</span>
                  </div>
                  <div className={styles.statusValue}>
                    {status?.discordConnected ? (
                      <Badge bg="success">Connected</Badge>
                    ) : (
                      <Badge bg="danger">Disconnected</Badge>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={4}>
              <Card className={styles.statusCard}>
                <Card.Body>
                  <div className={styles.statusHeader}>
                    <span>Model Health</span>
                  </div>
                  <div className={styles.statusValue}>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      onClick={handleTestModel}
                      disabled={statusLoading}
                    >
                      Test Model
                    </Button>
                    {status?.modelTest && (
                      <Badge bg={status.modelTest.success ? 'success' : 'danger'} className="ms-2">
                        {status.modelTest.success ? 'OK' : 'Failed'}
                      </Badge>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {status?.lastError && (
            <Card className={`${styles.statusCard} ${styles.errorCard} mt-3`}>
              <Card.Body>
                <div className={styles.statusHeader}>
                  <span>⚠️ Last Error</span>
                </div>
                <div className={styles.errorMessage}>
                  <small>{status.lastError.message}</small>
                  <br />
                  <small className="text-muted">{new Date(status.lastError.timestamp).toLocaleString()}</small>
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      )}

      {/* Broadcast Tab */}
      {activeTab === 'broadcast' && (
        <div className={styles.broadcastPanel}>
          <Card className={styles.broadcastCard}>
            <Card.Header className={styles.broadcastCardHeader}>
              <span>📡 Race Summary Broadcast</span>
              <Button variant="outline-primary" size="sm" onClick={onRefreshRaces} disabled={racesLoading}>
                {racesLoading ? <Spinner size="sm" /> : 'Refresh'}
              </Button>
            </Card.Header>
            <Card.Body>
              <p className={styles.broadcastDescription}>
                Select a recent race to broadcast its summary to the Discord channel.
              </p>
              
              {racesError && <Alert variant="danger">{racesError}</Alert>}
              
              {racesLoading ? (
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
                      {recentRaces.map((race) => (
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
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className={styles.chatPanel}>
          <div className={styles.chatHeader}>
            <span>Chat with Chorley</span>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={handleResetConversation}
            >
              Reset Conversation
            </Button>
          </div>
          
          <div className={styles.chatMessages}>
            {messages.length === 0 && (
              <div className={styles.chatEmpty}>
                <p>No messages yet. Start chatting with Chorley!</p>
                <small className="text-muted">Messages here won't be sent to Discord.</small>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`${styles.chatMessage} ${styles[msg.role]}`}
              >
                <div className={styles.messageHeader}>
                  <strong>{msg.role === 'user' ? 'You' : msg.role === 'assistant' ? 'Chorley' : 'System'}</strong>
                  <small>{formatTime(msg.timestamp)}</small>
                </div>
                <div className={styles.messageContent}>
                  {msg.content}
                </div>
                {msg.functionsCalled?.length > 0 && (
                  <div className={styles.functionsUsed}>
                    <small>Functions: {msg.functionsCalled.join(', ')}</small>
                  </div>
                )}
              </div>
            ))}
            {isSending && (
              <div className={`${styles.chatMessage} ${styles.assistant}`}>
                <div className={styles.messageContent}>
                  <Spinner size="sm" className="me-2" />
                  Chorley is thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <Form onSubmit={handleSendMessage} className={styles.chatInput}>
            <Form.Control
              type="text"
              placeholder="Type a message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isSending}
              className={styles.inputField}
            />
            <Button 
              type="submit" 
              variant="primary" 
              disabled={!inputMessage.trim() || isSending}
              className={styles.sendButton}
            >
              Send
            </Button>
          </Form>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className={styles.logsPanel}>
          <div className={styles.logsHeader}>
            <span>Recent Logs</span>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={fetchLogs}
              disabled={logsLoading}
            >
              {logsLoading ? <Spinner size="sm" /> : 'Refresh'}
            </Button>
          </div>
          
          <div className={styles.logsContainer}>
            {logs.length === 0 ? (
              <div className={styles.logsEmpty}>
                <p>No logs available.</p>
              </div>
            ) : (
              logs.map((log, idx) => (
                <div 
                  key={idx} 
                  className={`${styles.logEntry} ${styles[log.level]}`}
                >
                  <span className={styles.logTime}>{formatTime(log.timestamp)}</span>
                  <span className={styles.logLevel}>{log.level.toUpperCase()}</span>
                  <span className={styles.logMessage}>{log.message}</span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChorleyConsole;
