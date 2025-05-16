import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, ButtonGroup, Button, Form, Badge, Table, OverlayTrigger, Tooltip } from 'react-bootstrap';
import {
  ResponsiveContainer, ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ReferenceLine, Scatter
} from 'recharts';
import msToTime from '../../utils/msToTime';
import './SessionHistoryRaceTimeline.css';

const SessionHistoryRaceTimeline = ({ eventsData, race, selectedRacerName }) => {
  const [timelineData, setTimelineData] = useState([]);
  const [viewMode, setViewMode] = useState('time'); // 'time' or 'lap'
  const [zoomLevel, setZoomLevel] = useState('full'); // 'full', 'custom', 'start', 'middle', 'end'
  const [zoomRange, setZoomRange] = useState({ start: 0, end: 100 });
  const [enabledEvents, setEnabledEvents] = useState({
    lap: true,
    position: true,
    incident: true,
    state: true,
    pit: true
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [fieldPositions, setFieldPositions] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const timelineRef = useRef(null);

  // Process event data when it changes
  useEffect(() => {
    if (eventsData && eventsData.length > 0) {
      processEventData();
    }
  }, [eventsData]);

  // Scroll to selected event when it changes
  useEffect(() => {
    if (selectedEvent && timelineRef.current) {
      const eventElement = document.getElementById(`event-${selectedEvent.id}`);
      if (eventElement) {
        timelineRef.current.scrollTop = eventElement.offsetTop - 100;
      }
    }
  }, [selectedEvent]);

  const processEventData = () => {
    // Sort events chronologically
    const sortedEvents = [...eventsData].sort((a, b) => a.time - b.time);
    
    // Create timeline data with all events
    const processedData = [];
    let currentPosition = null;
    let currentLap = 0;
    let raceStart = sortedEvents[0]?.time || 0;
    let lapStartTime = raceStart;
    let previousLapTime = 0;
    let gapToLeader = 0;
    let stateChanges = [];
    
    // Initialize participant positions from race results
    const participants = race.results.map(participant => ({
      id: participant.participantid,
      name: participant.name,
      positions: []
    }));
    
    // Process events chronologically
    sortedEvents.forEach((event, index) => {
      const eventTime = event.time;
      const relativeTime = eventTime - raceStart;
      let eventCategory = 'other';
      let eventDescription = '';
      let eventDetail = '';
      let eventImpact = 0; // 0 = neutral, negative = bad, positive = good
      let positionChange = 0;
      
      // Process event based on type
      switch (event.event_name) {
        case 'Lap':
          eventCategory = 'lap';
          currentLap = event.attributes_Lap;
          currentPosition = event.attributes_RacePosition;
          const lapTime = event.attributes_LapTime;
          
          // Calculate delta to previous lap
          const lapDelta = previousLapTime > 0 ? lapTime - previousLapTime : 0;
          previousLapTime = lapTime;
          
          eventDescription = `Lap ${currentLap} completed`;
          eventDetail = `Time: ${msToTime(lapTime)} | S1: ${msToTime(event.attributes_Sector1Time)} | S2: ${msToTime(event.attributes_Sector2Time)} | S3: ${msToTime(event.attributes_Sector3Time)}`;
          
          // Add position marker
          if (participants) {
            const participant = participants.find(p => p.id === event.attributes_ParticipantId);
            if (participant) {
              participant.positions.push({
                time: relativeTime,
                lap: currentLap,
                position: currentPosition
              });
            }
          }
          break;
          
        case 'Impact':
          eventCategory = 'incident';
          eventDescription = 'Contact';
          const otherDriverId = event.attributes_OtherParticipantId;
          const otherDriverName = otherDriverId === -1 ? "wall" : 
            race.results.find(p => p.participantid === otherDriverId)?.name || "another driver";
          eventDetail = `Collision with ${otherDriverName} (magnitude ${event.attributes_CollisionMagnitude})`;
          
          // Stronger impacts have more negative effect
          eventImpact = -Math.min(10, Math.ceil(event.attributes_CollisionMagnitude / 10));
          break;
          
        case 'CutTrackStart':
          eventCategory = 'incident';
          eventDescription = 'Off-track excursion';
          eventDetail = `Running P${event.attributes_RacePosition} on lap ${event.attributes_Lap}`;
          eventImpact = -2;
          break;
          
        case 'CutTrackEnd':
          eventCategory = 'incident';
          eventDescription = 'Returned to track';
          eventDetail = `Off-track time: ${msToTime(event.attributes_ElapsedTime)} | Positions gained: ${event.attributes_PlaceGain} | Penalty: ${event.attributes_PenaltyValue}`;
          
          // Time penalty is negative impact
          eventImpact = event.attributes_PenaltyValue > 0 ? -5 : 0;
          break;
          
        case 'State':
          eventCategory = 'state';
          const newState = event.attributes_NewState.replace(/([A-Z])/g, ' $1').trim();
          eventDescription = `State change: ${newState}`;
          
          // Track state changes for pit detection
          stateChanges.push({
            time: relativeTime,
            state: newState
          });
          
          // Check for pit entry/exit
          if (newState.toLowerCase().includes('pit') || newState.toLowerCase().includes('garage')) {
            eventCategory = 'pit';
            eventDescription = 'Pit entry';
          } else if (stateChanges.length > 1 && 
                    (stateChanges[stateChanges.length - 2].state.toLowerCase().includes('pit') || 
                     stateChanges[stateChanges.length - 2].state.toLowerCase().includes('garage'))) {
            eventCategory = 'pit';
            eventDescription = 'Pit exit';
          }
          break;
          
        default:
          eventCategory = 'other';
          eventDescription = event.event_name;
      }
      
      // Add event to timeline
      processedData.push({
        id: index,
        time: relativeTime,
        lap: currentLap,
        category: eventCategory,
        description: eventDescription,
        detail: eventDetail,
        position: currentPosition,
        impact: eventImpact,
        positionChange: positionChange,
        originalEvent: event
      });
    });
    
    // Process position data for field position visualization
    setFieldPositions(participants);
    
    // Set the timeline data
    setTimelineData(processedData);
  };
  
  // Get color based on event category
  const getEventColor = (category) => {
    switch (category) {
      case 'lap': return '#28a745';
      case 'incident': return '#dc3545';
      case 'state': return '#17a2b8';
      case 'pit': return '#6f42c1';
      case 'position': return '#fd7e14';
      default: return '#6c757d';
    }
  };
  
  // Get icon based on event category
  const getEventIcon = (category, description) => {
    switch (category) {
      case 'lap': return 'bi-stopwatch';
      case 'incident': 
        if (description.includes('Contact')) return 'bi-exclamation-triangle-fill';
        return 'bi-exclamation-diamond';
      case 'state': return 'bi-arrow-repeat';
      case 'pit': 
        if (description.includes('entry')) return 'bi-box-arrow-in-right';
        return 'bi-box-arrow-in-left';
      case 'position': 
        if (description.includes('gain')) return 'bi-arrow-up-circle';
        return 'bi-arrow-down-circle';
      default: return 'bi-circle';
    }
  };
  
  // Filter events based on enabled types and zoom range
  const getFilteredEvents = () => {
    return timelineData.filter(event => {
      // Filter by event type
      if (!enabledEvents[event.category]) return false;
      
      // Apply zoom range
      if (zoomLevel === 'custom') {
        const totalDuration = timelineData[timelineData.length - 1]?.time || 1;
        const eventTimePercent = (event.time / totalDuration) * 100;
        return eventTimePercent >= zoomRange.start && eventTimePercent <= zoomRange.end;
      }
      
      return true;
    });
  };
  
  // Format time for display (MM:SS.mmm)
  const formatRaceTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const milliseconds = Math.floor((timeInSeconds % 1) * 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };
  
  // Handle zoom level changes
  const handleZoomChange = (level) => {
    setZoomLevel(level);
    
    // Set predefined zoom ranges
    switch (level) {
      case 'start':
        setZoomRange({ start: 0, end: 33 });
        break;
      case 'middle':
        setZoomRange({ start: 33, end: 66 });
        break;
      case 'end':
        setZoomRange({ start: 66, end: 100 });
        break;
      case 'full':
        setZoomRange({ start: 0, end: 100 });
        break;
      // 'custom' handled by the range slider
      default:
        break;
    }
  };
  
  // Handle range slider changes
  const handleRangeChange = (e, type) => {
    const value = parseInt(e.target.value, 10);
    setZoomLevel('custom');
    
    if (type === 'start') {
      setZoomRange(prev => ({ ...prev, start: Math.min(value, prev.end - 5) }));
    } else {
      setZoomRange(prev => ({ ...prev, end: Math.max(value, prev.start + 5) }));
    }
  };
  
  // Handle event selection
  const handleEventSelect = (event) => {
    setSelectedEvent(event);
  };
  
  // Handle event type toggle
  const handleEventTypeToggle = (type) => {
    setEnabledEvents(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };
  
  // Get segments of interest (battles, incidents, strong lap sequences)
  const getSegmentsOfInterest = () => {
    // This would analyze the data to find interesting segments
    // For now, let's create some example segments
    const segments = [];
    let lastIncidentTime = null;
    
    // Look for groups of incidents
    timelineData.forEach(event => {
      if (event.category === 'incident') {
        if (lastIncidentTime && event.time - lastIncidentTime < 60) {
          // Add segment for incident cluster
          segments.push({
            id: `segment-incident-${event.time}`,
            startTime: lastIncidentTime - 5,
            endTime: event.time + 5,
            type: 'incident-cluster',
            title: 'Multiple Incidents',
            description: 'Cluster of incidents within a short timeframe'
          });
        }
        lastIncidentTime = event.time;
      }
    });
    
    // Find pit windows
    const pitEvents = timelineData.filter(event => event.category === 'pit');
    if (pitEvents.length >= 2) {
      for (let i = 0; i < pitEvents.length; i += 2) {
        if (i + 1 < pitEvents.length) {
          segments.push({
            id: `segment-pit-${i}`,
            startTime: pitEvents[i].time - 5,
            endTime: pitEvents[i + 1].time + 5,
            type: 'pit-stop',
            title: 'Pit Stop',
            description: 'Pit stop sequence'
          });
        }
      }
    }
    
    return segments;
  };
  
  // Format position data for chart
  const formatPositionDataForChart = () => {
    const data = [];
    const maxLap = Math.max(...timelineData.filter(e => e.lap).map(e => e.lap)) || 0;
    
    // Create data points for each lap
    for (let lap = 1; lap <= maxLap; lap++) {
      const lapData = { lap };
      
      // Add position for each participant
      fieldPositions.forEach(participant => {
        const posAtLap = participant.positions.find(pos => pos.lap === lap);
        if (posAtLap) {
          lapData[participant.name] = posAtLap.position;
        }
      });
      
      data.push(lapData);
    }
    
    return data;
  };
  
  // Get position chart line colors - generate unique colors for each driver
  const getPositionChartColors = () => {
    const colorPalette = [
      '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', 
      '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
      '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5'
    ];
    
    const colors = {};
    fieldPositions.forEach((participant, index) => {
      // Highlight selected driver
      if (participant.name === selectedRacerName) {
        colors[participant.name] = '#ff0000'; // Bright red for selected driver
      } else {
        colors[participant.name] = colorPalette[index % colorPalette.length];
      }
    });
    
    return colors;
  };
  
  // Custom tooltip for position chart
  const PositionTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const sortedData = [...payload].sort((a, b) => a.value - b.value);
      
      return (
        <div className="position-chart-tooltip">
          <p className="tooltip-title">Lap {label}</p>
          <div className="tooltip-content">
            {sortedData.map((entry, index) => (
              <div 
                key={`position-${index}`}
                className={`tooltip-item ${entry.name === selectedRacerName ? 'highlighted' : ''}`}
              >
                <div 
                  className="color-box" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="driver-name">{entry.name}</span>
                <span className="position-value">P{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Get filtered events for display
  const filteredEvents = getFilteredEvents();
  const segments = getSegmentsOfInterest();
  const positionData = formatPositionDataForChart();
  const positionColors = getPositionChartColors();
  
  return (
    <div className="race-timeline">
      <Card className="mb-3">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Race Timeline</h5>
            <div className="view-mode-toggle">
              <ButtonGroup size="sm">
                <Button
                  variant={viewMode === 'time' ? 'primary' : 'outline-primary'}
                  onClick={() => setViewMode('time')}
                >
                  Time-based
                </Button>
                <Button
                  variant={viewMode === 'lap' ? 'primary' : 'outline-primary'}
                  onClick={() => setViewMode('lap')}
                >
                  Lap-based
                </Button>
              </ButtonGroup>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {/* Control panel */}
          <Row className="mb-4">
            <Col md={5}>
              <div className="event-type-filter">
                <h6>Event Types</h6>
                <div className="filter-buttons">
                  <Button
                    size="sm"
                    variant={enabledEvents.lap ? 'success' : 'outline-success'}
                    className="me-1 mb-1"
                    onClick={() => handleEventTypeToggle('lap')}
                  >
                    <i className="bi bi-stopwatch me-1"></i> Laps
                  </Button>
                  <Button
                    size="sm"
                    variant={enabledEvents.incident ? 'danger' : 'outline-danger'}
                    className="me-1 mb-1"
                    onClick={() => handleEventTypeToggle('incident')}
                  >
                    <i className="bi bi-exclamation-triangle me-1"></i> Incidents
                  </Button>
                  <Button
                    size="sm"
                    variant={enabledEvents.state ? 'info' : 'outline-info'}
                    className="me-1 mb-1"
                    onClick={() => handleEventTypeToggle('state')}
                  >
                    <i className="bi bi-arrow-repeat me-1"></i> State Changes
                  </Button>
                  <Button
                    size="sm"
                    variant={enabledEvents.pit ? 'purple' : 'outline-purple'}
                    className="me-1 mb-1"
                    onClick={() => handleEventTypeToggle('pit')}
                  >
                    <i className="bi bi-tools me-1"></i> Pit Stops
                  </Button>
                </div>
              </div>
            </Col>
            <Col md={7}>
              <div className="zoom-control">
                <h6>Timeline Zoom</h6>
                <div className="d-flex align-items-center">
                  <ButtonGroup size="sm" className="me-2">
                    <Button
                      variant={zoomLevel === 'full' ? 'secondary' : 'outline-secondary'}
                      onClick={() => handleZoomChange('full')}
                    >
                      Full Race
                    </Button>
                    <Button
                      variant={zoomLevel === 'start' ? 'secondary' : 'outline-secondary'}
                      onClick={() => handleZoomChange('start')}
                    >
                      Start
                    </Button>
                    <Button
                      variant={zoomLevel === 'middle' ? 'secondary' : 'outline-secondary'}
                      onClick={() => handleZoomChange('middle')}
                    >
                      Middle
                    </Button>
                    <Button
                      variant={zoomLevel === 'end' ? 'secondary' : 'outline-secondary'}
                      onClick={() => handleZoomChange('end')}
                    >
                      End
                    </Button>
                  </ButtonGroup>
                  
                  <Button
                    size="sm"
                    variant="outline-primary"
                    className="ms-auto"
                    onClick={() => setSelectedEvent(null)}
                  >
                    Clear Selection
                  </Button>
                </div>
                
                <div className="range-sliders mt-2">
                  <div className="d-flex align-items-center">
                    <span className="small me-2">Start:</span>
                    <Form.Range
                      min={0}
                      max={95}
                      value={zoomRange.start}
                      onChange={(e) => handleRangeChange(e, 'start')}
                      className="flex-grow-1"
                    />
                    <span className="small ms-2">{zoomRange.start}%</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="small me-2">End:</span>
                    <Form.Range
                      min={5}
                      max={100}
                      value={zoomRange.end}
                      onChange={(e) => handleRangeChange(e, 'end')}
                      className="flex-grow-1"
                    />
                    <span className="small ms-2">{zoomRange.end}%</span>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
          
          {/* Position flow chart */}
          <div className="position-chart mb-4">
            <h6>Position Changes</h6>
            <div style={{ height: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={positionData}
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="lap" />
                  <YAxis reversed domain={[1, fieldPositions.length]} 
                    ticks={Array.from({length: fieldPositions.length}, (_, i) => i + 1)} 
                    label={{ value: 'Position', angle: -90, position: 'insideLeft' }}
                  />
                  <RechartsTooltip content={<PositionTooltip />} />
                  <Legend />
                  
                  {/* Draw lines for each participant */}
                  {fieldPositions.map((participant) => (
                    <Line
                      key={participant.id}
                      type="monotone"
                      dataKey={participant.name}
                      stroke={positionColors[participant.name]}
                      strokeWidth={participant.name === selectedRacerName ? 3 : 1.5}
                      dot={{ r: participant.name === selectedRacerName ? 4 : 3 }}
                      activeDot={{ r: participant.name === selectedRacerName ? 8 : 6 }}
                      connectNulls={true}
                    />
                  ))}
                  
                  {/* Mark selected event on the chart */}
                  {selectedEvent && selectedEvent.lap && (
                    <ReferenceLine
                      x={selectedEvent.lap}
                      stroke="red"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      label={{ value: 'Selected Event', position: 'top', fill: 'red' }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Main timeline visualization */}
          <div className="timeline-visualization">
            <h6>Event Timeline</h6>
            <div className="timeline-container" ref={timelineRef}>
              <div className="timeline-track">
                {/* Indicators for segments of interest */}
                {segments.map(segment => (
                  <div
                    key={segment.id}
                    className={`timeline-segment segment-${segment.type}`}
                    style={{
                      left: `${(segment.startTime / (timelineData[timelineData.length - 1]?.time || 1)) * 100}%`,
                      width: `${((segment.endTime - segment.startTime) / (timelineData[timelineData.length - 1]?.time || 1)) * 100}%`
                    }}
                    title={segment.title}
                    onClick={() => setSelectedSegment(segment)}
                  ></div>
                ))}
                
                {/* Event markers */}
                {filteredEvents.map(event => (
                  <div 
                    id={`event-${event.id}`}
                    key={event.id}
                    className={`timeline-event event-${event.category} ${selectedEvent === event ? 'selected' : ''}`}
                    style={{
                      left: `${(event.time / (timelineData[timelineData.length - 1]?.time || 1)) * 100}%`
                    }}
                    onClick={() => handleEventSelect(event)}
                  >
                    <OverlayTrigger
                      placement="top"
                      overlay={
                        <Tooltip>
                          <div>{event.description}</div>
                          <div className="small">{formatRaceTime(event.time)}</div>
                        </Tooltip>
                      }
                    >
                      <div className="event-marker">
                        <i className={`bi ${getEventIcon(event.category, event.description)}`}></i>
                      </div>
                    </OverlayTrigger>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Selected event details */}
          {selectedEvent && (
            <div className="event-details mt-4">
              <Card className="border-primary">
                <Card.Header className="bg-primary text-white">
                  <h6 className="mb-0">
                    <i className={`bi ${getEventIcon(selectedEvent.category, selectedEvent.description)} me-2`}></i>
                    {selectedEvent.description}
                    <Badge bg="light" text="dark" className="ms-2">
                      {formatRaceTime(selectedEvent.time)}
                    </Badge>
                    {selectedEvent.lap && (
                      <Badge bg="light" text="dark" className="ms-2">
                        Lap {selectedEvent.lap}
                      </Badge>
                    )}
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <div className="event-data">
                        <Table size="sm" borderless>
                          <tbody>
                            <tr>
                              <td className="fw-bold">Type:</td>
                              <td>
                                <Badge
                                  bg={
                                    selectedEvent.category === 'lap' ? 'success' :
                                    selectedEvent.category === 'incident' ? 'danger' :
                                    selectedEvent.category === 'state' ? 'info' :
                                    selectedEvent.category === 'pit' ? 'purple' :
                                    'secondary'
                                  }
                                >
                                  {selectedEvent.category.charAt(0).toUpperCase() + selectedEvent.category.slice(1)}
                                </Badge>
                              </td>
                            </tr>
                            {selectedEvent.detail && (
                              <tr>
                                <td className="fw-bold">Details:</td>
                                <td>{selectedEvent.detail}</td>
                              </tr>
                            )}
                            {selectedEvent.position && (
                              <tr>
                                <td className="fw-bold">Position:</td>
                                <td>P{selectedEvent.position}</td>
                              </tr>
                            )}
                            {selectedEvent.impact !== 0 && (
                              <tr>
                                <td className="fw-bold">Impact:</td>
                                <td className={selectedEvent.impact > 0 ? 'text-success' : 'text-danger'}>
                                  {selectedEvent.impact > 0 ? '+' : ''}{selectedEvent.impact}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </div>
                    </Col>
                    <Col md={6}>
                      {selectedEvent.category === 'lap' && (
                        <div className="lap-analysis">
                          <h6>Lap Time Analysis</h6>
                          <div className="sector-times d-flex justify-content-between">
                            <div className="sector">
                              <span className="sector-name">S1</span>
                              <span className="sector-time">{msToTime(selectedEvent.originalEvent.attributes_Sector1Time)}</span>
                            </div>
                            <div className="sector">
                              <span className="sector-name">S2</span>
                              <span className="sector-time">{msToTime(selectedEvent.originalEvent.attributes_Sector2Time)}</span>
                            </div>
                            <div className="sector">
                              <span className="sector-name">S3</span>
                              <span className="sector-time">{msToTime(selectedEvent.originalEvent.attributes_Sector3Time)}</span>
                            </div>
                          </div>
                          
                          {/* Find adjacent events to show impact of incidents */}
                          {(() => {
                            const eventIndex = timelineData.findIndex(e => e.id === selectedEvent.id);
                            const prevLap = timelineData
                              .slice(0, eventIndex)
                              .reverse()
                              .find(e => e.category === 'lap');
                            
                            if (prevLap) {
                              const delta = selectedEvent.originalEvent.attributes_LapTime - prevLap.originalEvent.attributes_LapTime;
                              const isSlower = delta > 0;
                              
                              // Find incidents between previous lap and this one
                              const incidentsBetween = timelineData
                                .slice(timelineData.findIndex(e => e.id === prevLap.id), eventIndex)
                                .filter(e => e.category === 'incident');
                              
                              return (
                                <div className="lap-comparison mt-3">
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div>vs Lap {prevLap.lap}:</div>
                                    <div className={isSlower ? 'text-danger' : 'text-success'}>
                                      {isSlower ? '+' : '-'}{msToTime(Math.abs(delta))}
                                    </div>
                                  </div>
                                  
                                  {incidentsBetween.length > 0 && (
                                    <div className="incidents-impact mt-2">
                                      <div className="text-danger">
                                        <i className="bi bi-exclamation-triangle me-1"></i>
                                        {incidentsBetween.length} incident{incidentsBetween.length > 1 ? 's' : ''} affected this lap
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      )}
                      
                      {selectedEvent.category === 'incident' && (
                        <div className="incident-impact">
                          <h6>Incident Impact</h6>
                          {(() => {
                            const eventIndex = timelineData.findIndex(e => e.id === selectedEvent.id);
                            const nextLap = timelineData
                              .slice(eventIndex)
                              .find(e => e.category === 'lap');
                            const prevLap = timelineData
                              .slice(0, eventIndex)
                              .reverse()
                              .find(e => e.category === 'lap');
                              
                            if (nextLap && prevLap) {
                              const delta = nextLap.originalEvent.attributes_LapTime - prevLap.originalEvent.attributes_LapTime;
                              const impactText = delta > 1000 ? 'Significant impact' :
                                               delta > 500 ? 'Moderate impact' :
                                               delta > 0 ? 'Minor impact' : 'No apparent impact';
                              
                              return (
                                <>
                                  <div className="d-flex justify-content-between">
                                    <div>Time Impact:</div>
                                    <div className={delta > 0 ? 'text-danger' : 'text-success'}>
                                      {delta > 0 ? '+' : ''}{msToTime(delta)}
                                    </div>
                                  </div>
                                  <div className="mt-2">
                                    <div className={`impact-assessment ${delta > 500 ? 'text-danger' : delta > 0 ? 'text-warning' : 'text-success'}`}>
                                      {impactText} on subsequent lap time
                                    </div>
                                  </div>
                                  
                                  {nextLap.position !== prevLap.position && (
                                    <div className="mt-2">
                                      <div className={nextLap.position > prevLap.position ? 'text-danger' : 'text-success'}>
                                        Position change: P{prevLap.position} → P{nextLap.position}
                                        {nextLap.position > prevLap.position ? ' (lost positions)' : ' (gained positions)'}
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            }
                            return (
                              <div className="text-muted">
                                Insufficient data to analyze impact
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </div>
          )}
          
          {/* Selected segment details */}
          {selectedSegment && !selectedEvent && (
            <div className="segment-details mt-4">
              <Card className="border-info">
                <Card.Header className="bg-info text-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">{selectedSegment.title}</h6>
                  <Button 
                    variant="light" 
                    size="sm"
                    onClick={() => setSelectedSegment(null)}
                  >
                    <i className="bi bi-x"></i>
                  </Button>
                </Card.Header>
                <Card.Body>
                  <p>{selectedSegment.description}</p>
                  <p>
                    <strong>Time range:</strong> {formatRaceTime(selectedSegment.startTime)} - {formatRaceTime(selectedSegment.endTime)}
                  </p>
                  
                  <div className="segment-events mt-3">
                    <h6>Events in this segment:</h6>
                    <div className="segment-event-list">
                      {timelineData
                        .filter(event => 
                          event.time >= selectedSegment.startTime && 
                          event.time <= selectedSegment.endTime
                        )
                        .map(event => (
                          <Button 
                            key={event.id}
                            variant="outline-secondary" 
                            size="sm"
                            className="me-2 mb-2"
                            onClick={() => handleEventSelect(event)}
                          >
                            <i className={`bi ${getEventIcon(event.category, event.description)} me-1`}></i>
                            {event.description}
                          </Button>
                        ))}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default SessionHistoryRaceTimeline;