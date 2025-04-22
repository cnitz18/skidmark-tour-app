import React, { useState, useEffect } from 'react';
import { Container, Row } from 'react-bootstrap';
import PageHeader from '../shared/PageHeader';
import './ServerStatus.css';

const ServerStatus = () => {
  const [isServerLive, setIsServerLive] = useState(false);
  const [configLink, setConfigLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServerStatus = async () => {
      try {
        const statusResponse = await fetch(process.env.REACT_APP_SERVER_LOC + 'api/session/status?attributes=true&members=true&participants=true');
        
        if (!statusResponse.ok) {
          throw new Error(`Status error: ${statusResponse.status}`);
        }
        
        const statusData = await statusResponse.json();
        console.log('Server status data:', statusData);
        setIsServerLive(statusResponse.ok);
        
        setConfigLink(process.env.REACT_APP_SERVER_LOC + 'sessionConfig');
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch server status');
        setLoading(false);
        console.error('Error fetching server status:', err);
      }
    };

    fetchServerStatus();
    
    // Set up polling to check status periodically
    const intervalId = setInterval(fetchServerStatus, 60000); // Check every minute
    
    return () => clearInterval(intervalId); // Clean up on unmount
  }, []);

  if (loading) {
    return <div className="server-status-loading">Loading server status...</div>;
  }

  if (error) {
    return <div className="server-status-error">{error}</div>;
  }

  return (
    <Container>
      <PageHeader title="Automobilista 2 Server Status"/>
      <Row>
        <div className="server-status-container">          
          <div className="status-indicator">
            <div className={`status-dot ${isServerLive ? 'online' : 'offline'}`}></div>
            <span className="status-text">Server is currently {isServerLive ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
          
          {isServerLive && configLink && (
            <div className="config-link-container">
              <p>Configure your session:</p>
              <a 
                href={configLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="config-button"
              >
                Session Configuration Portal
              </a>
            </div>
          )}
          
          <div className="last-updated">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </Row>
    </Container>
  );
};

export default ServerStatus;