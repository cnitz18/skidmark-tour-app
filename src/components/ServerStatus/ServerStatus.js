import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaCar, FaUsers, FaCloudRain, FaServer, FaPlayCircle } from 'react-icons/fa';
import NameMapper from '../../utils/Classes/NameMapper';
import PageHeader from '../shared/PageHeader';
import fullLogo from '../../assets/Skidmark_Logo_1.png';
import './ServerStatus.css';
// TODO LIST:
// - make "participants" key off of participants not members
// - handle race condition causing stats to sometimes load and sometimes not
// - make the server status more dynamic: is the server online? is the session active?
// - 

const ServerStatus = ({ enums, lists }) => {
  const [isServerLive, setIsServerLive] = useState(false);
  const [configLink, setConfigLink] = useState('');
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [serverInfo, setServerInfo] = useState({
    serverName: 'Skidmark Tour Server',
    currentTrack: 'Unknown Track',
    currentVehicle: 'Unknown Vehicle',
    playerCount: '0',
    sessionType: 'Unknown',
    weatherCondition: 'Unknown'
  });

  useEffect(() => {
    const fetchServerStatus = async () => {
      try {
        const statusResponse = await fetch(process.env.REACT_APP_SERVER_LOC + 'api/session/status?attributes=true&members=true&participants=true');
        
        if (!statusResponse.ok) {
          throw new Error(`Status error: ${statusResponse.status}`);
        }
        setIsServerLive(statusResponse.ok);
        
        let statusData = await statusResponse.json();
        if( statusData.result === 'ok')
          statusData = statusData.response;

        setIsSessionActive(statusData.state === 'Running');

        // Update server info if available
        if (statusData && statusData.attributes) {
          let weatherArray = [];
          for( let i = 0; i < statusData.attributes.RaceWeatherSlots; i++){
            weatherArray.push(NameMapper.fromWeatherSlot(statusData.attributes["RaceWeatherSlot" + (i+1)], enums));
          }

          setServerInfo({
            serverName: statusData.name || 'Skidmark Tour Server',
            currentTrack:  NameMapper.fromTrackId(statusData.attributes.TrackId,lists["tracks"]?.list) || 'Unknown Track',
            currentVehicle: NameMapper.fromVehicleClassId(statusData.attributes.VehicleClassId,lists['vehicle_classes']?.list) || 'Unknown Vehicle',
            playerCount: statusData.members.length || '0',
            members : statusData.members,
            participants : statusData.participants,
            sessionType: statusData.attributes.SessionStage || 'Unknown',
            sessionState: statusData.attributes.SessionState,
            weatherCondition: weatherArray || 'Dynamic'
          });
        }
        
        setConfigLink(process.env.REACT_APP_SERVER_LOC + 'sessionConfig');
        
        // setLoading(false);
      } catch (err) {
        // setError('Failed to fetch server status');
        // setLoading(false);
        console.error('Error fetching server status:', err);
      }
    };

    fetchServerStatus();
    
    // Set up polling to check status periodically
    const intervalId = setInterval(fetchServerStatus, 60000); // Check every minute
    
    return () => clearInterval(intervalId); // Clean up on unmount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lists]);

  // Weather component to handle displaying multiple weather slots
  const WeatherDisplay = ({ weatherCondition }) => {
    // If weatherCondition is a string, display it directly
    if (typeof weatherCondition === 'string') {
      return <p>{weatherCondition}</p>;
    }
    
    // If weatherCondition is an array, display each slot
    if (Array.isArray(weatherCondition) && weatherCondition.length > 0) {
      return (
        <div className="weather-slots">
          {weatherCondition.map((weather, index) => (
            <div key={index} className="weather-slot">
              <span className="weather-slot-number">Slot {index + 1}:</span> {weather}
            </div>
          ))}
        </div>
      );
    }
    
    // Fallback
    return <p>Dynamic</p>;
  };

  // New Participants list component
  const ParticipantsList = ({ members }) => {
    if (!members || members.length === 0) {
      return <p className="no-participants">No drivers currently connected</p>;
    }

    return (
      <div className="participants-container">
        <h4><FaUsers size={24} className="me-2" color="#28a745" /> Current Participants</h4>
        <div className="participants-list">
          <table className="participants-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Driver</th>
                <th>Vehicle</th>
              </tr>
            </thead>
            <tbody>
              {members?.length ? members.map((member, index) => (
                <tr key={index} className={(member.name ?? member.attributes.Name).indexOf("(AI)") !== -1 ? 'ai-driver' : ''}>
                  <td>
                    <span className={`status-badge ${member.state ? member.state.toLowerCase() : member.attributes.State.toLowerCase()}`}>
                      {member.state ? member.state : member.attributes.State}
                    </span>
                  </td>
                  <td className="driver-name">
                    {member.isAI && <span className="ai-badge">AI</span>}
                    {member.name ?? member.attributes.Name}
                  </td>
                  <td>{NameMapper.fromVehicleId(member.attributes.VehicleId,lists['vehicles']?.list) || 'Unknown'}</td>
                </tr>
              )) : null}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <Container>
      <PageHeader title="Automobilista 2 Server Status" logo={fullLogo}/>
      <Row>
        <Col lg={8} className="mx-auto">
          <div className="server-status-container">
            <div className="status-card">
              <FaServer size={48} color={isServerLive ? "#28a745" : "#dc3545"} />
              <h3 className="mt-3">{serverInfo.serverName}</h3>
              
              <div className="status-indicator">
                <div className={`status-dot ${isServerLive ? 'online' : 'offline'}`}></div>
                <span className="status-text">Server is currently {isServerLive ? 'ONLINE' : 'OFFLINE'}</span>
              </div>              
              {(isServerLive && configLink) && (
                <div className="config-link-container">
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
            </div>
            
            {/* Only show server info when there's an active session */}
            {(isServerLive && isSessionActive && Object.keys(serverInfo).length > 0) ? (
              <>
                <div className="server-info">
                  {/* Add Session Status card */}
                  <div className="info-card">
                    <FaPlayCircle size={24} color="#dc3545" />
                    <h4>Session Status</h4>
                    <p>{serverInfo.sessionState || 'Unknown'}</p>
                  </div>

                  <div className="info-card">
                    <FaCar size={24} color="#007bff" />
                    <h4>Track</h4>
                    <p>{serverInfo.currentTrack}</p>
                  </div>
                  
                  <div className="info-card">
                    <FaCar size={24} color="#ffc107" />
                    <h4>Vehicle Class</h4>
                    <p>{serverInfo.currentVehicle}</p>
                  </div>

                  {/* Weather component with fixed width */}
                  <div className="info-card weather-card fixed-width-card">
                    <FaCloudRain size={24} color="#17a2b8" />
                    <h4>Weather</h4>
                    <WeatherDisplay weatherCondition={serverInfo.weatherCondition} />
                  </div>
                </div>

                {/* Add new Participants component */}
                <div className="participants-section">
                  <ParticipantsList members={serverInfo.sessionState === "Lobby" ? serverInfo.members : serverInfo.participants} />
                </div>
              </>
            ) : isServerLive ? (
              <div className="no-session-message mt-4">
                <p>No active session currently in progress.</p>
              </div>
            ) : (
              <div className="offline-message mt-4">
                <p>The server is currently offline. Please check back later or contact Casey for help.</p>
              </div>
            )}
            <div className="last-updated">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ServerStatus;