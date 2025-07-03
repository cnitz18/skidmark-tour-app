import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Card, Badge, Table, Nav, ButtonGroup } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import msToTime from '../../utils/msToTime';
import { useRaceAnalytics } from '../../utils/RaceAnalyticsContext';
import './SessionHistoryHeadToHeadComparison.css';
import getStandardizedEventData from '../../utils/getStandardizedEventData';
import detectPitStops from '../../utils/detectPitStops';

const SessionHistoryHeadToHeadComparison = ({ race, session, selectedDriver }) => {
  const { driverAnalytics } = useRaceAnalytics();

  const [comparisonDriver, setComparisonDriver] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [primaryDriverData, setPrimaryDriverData] = useState([]);
  const [comparisonDriverData, setComparisonDriverData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [battles, setBattles] = useState([]);
  const [selectedBattle, setSelectedBattle] = useState(null);
  const [gapData, setGapData] = useState([]);
  const [stats, setStats] = useState({
    primary: { avgLapTime: 0, bestLapTime: 0, consistency: 0 },
    comparison: { avgLapTime: 0, bestLapTime: 0, consistency: 0 }
  });
  const [selectedSector, setSelectedSector] = useState(1);
  const [analysisMode, setAnalysisMode] = useState('all'); // 'all' or 'clean'

  // Initialize available drivers for comparison
  useEffect(() => {
    if (race && race.results) {
      // Filter out the selected driver from available options
      const availableDrivers = race.results.filter(driver => 
        driver.name !== selectedDriver.name
      );
      setDrivers(availableDrivers);
      
      // If no comparison driver is selected yet and we have options, select the first one
      if (!comparisonDriver && availableDrivers.length > 0) {
        setComparisonDriver(availableDrivers[0]);
      }
    }
  }, [race, selectedDriver, comparisonDriver]);

  // Load data when drivers change
  useEffect(() => {
    if (selectedDriver && comparisonDriver && driverAnalytics) {
      loadDriverData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDriver, comparisonDriver,driverAnalytics]);

  // Process data to calculate battles and stats when both datasets are available
  useEffect(() => {
    if (primaryDriverData.length > 0 && comparisonDriverData.length > 0) {
      processHeadToHeadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryDriverData, comparisonDriverData, analysisMode]); // Add analysisMode to dependency array

  // Load data for both selected drivers
  const loadDriverData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch data for primary driver
      const primaryData = await getStandardizedEventData(selectedDriver.stage, selectedDriver.participantid);
      setPrimaryDriverData(primaryData);
      
      // Fetch data for comparison driver
      const comparisonData = await getStandardizedEventData(comparisonDriver.stage, comparisonDriver.participantid);
      setComparisonDriverData(comparisonData);
      
    } catch (error) {
      console.error("Error loading driver data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Process the data to identify battles, gaps, and stats
  const processHeadToHeadData = () => {
    // Filter lap events for both drivers
    const primaryLaps = primaryDriverData.filter(evt => evt.event_name === "Lap");
    const comparisonLaps = comparisonDriverData.filter(evt => evt.event_name === "Lap");

    // Detect pit stops
    const primaryPitLaps = detectPitStops(primaryDriverData, primaryLaps);
    const comparisonPitLaps = detectPitStops(comparisonDriverData, comparisonLaps);

    // Filter laps based on analysis mode
    let filteredPrimaryLaps = primaryLaps;
    let filteredComparisonLaps = comparisonLaps;

    if (analysisMode === 'clean') {
      filteredPrimaryLaps = primaryLaps.filter(lap => 
        lap.attributes_Lap > 1 &&
        !primaryPitLaps.in.includes(lap.attributes_Lap) && 
        !primaryPitLaps.out.includes(lap.attributes_Lap)
      );
      
      filteredComparisonLaps = comparisonLaps.filter(lap => 
        lap.attributes_Lap > 1 &&
        !comparisonPitLaps.in.includes(lap.attributes_Lap) && 
        !comparisonPitLaps.out.includes(lap.attributes_Lap)
      );
    }

    // Calculate statistics for both drivers
    const primaryStats = calculateDriverStats(filteredPrimaryLaps);
    const comparisonStats = calculateDriverStats(filteredComparisonLaps);
    
    setStats({
      primary: primaryStats,
      comparison: comparisonStats
    });
    
    // Generate gap data for visualization
    const gapsByLap = generateGapData(filteredPrimaryLaps, filteredComparisonLaps);
    setGapData(gapsByLap);
    
    // Identify battles (when drivers are within 2 seconds of each other for multiple laps)
    const battlePeriods = identifyBattles(gapsByLap);
    setBattles(battlePeriods);
  };

  // Calculate statistics for a driver
  const calculateDriverStats = (laps) => {
    if (!laps.length) return { avgLapTime: 0, bestLapTime: 0, consistency: 0 };
    var driverData = driverAnalytics[laps[0].participantid];
    if (!driverData) return { avgLapTime: 0, bestLapTime: 0, consistency: 0 };
    return {
      avgLapTime: driverData.avgLapTimeFullRace,
      bestLapTime: driverData.bestLapTime,
      consistency: driverData.consistency
    };
  };

  // Generate gap data between drivers for each lap
  const generateGapData = (primaryLaps, comparisonLaps) => {
    const maxLaps = Math.max(
      primaryLaps.length > 0 ? primaryLaps[primaryLaps.length - 1].attributes_Lap : 0,
      comparisonLaps.length > 0 ? comparisonLaps[comparisonLaps.length - 1].attributes_Lap : 0
    );
    
    const gapData = [];
    
    for (let lap = 1; lap <= maxLaps; lap++) {
      const primaryLap = primaryLaps.find(l => l.attributes_Lap === lap);
      const comparisonLap = comparisonLaps.find(l => l.attributes_Lap === lap);
      if (primaryLap && comparisonLap) {
        // Calculate position gap
        const posGap = primaryLap.attributes_RacePosition - comparisonLap.attributes_RacePosition;
        
        // Calculate time gap (in seconds for better visualization)
        const primaryTime = primaryLap.attributes_LapTime;
        const comparisonTime = comparisonLap.attributes_LapTime;
        const timeGap = (primaryTime - comparisonTime) / 1000; // Convert ms to seconds
        
        gapData.push({
          lap,
          timeGap,
          posGap,
          primaryPos: primaryLap.attributes_RacePosition,
          comparisonPos: comparisonLap.attributes_RacePosition,
          primaryTime: primaryTime / 1000, // Convert to seconds
          comparisonTime: comparisonTime / 1000, // Convert to seconds
          primaryS1: primaryLap.attributes_Sector1Time / 1000,
          primaryS2: primaryLap.attributes_Sector2Time / 1000,
          primaryS3: primaryLap.attributes_Sector3Time / 1000,
          comparisonS1: comparisonLap.attributes_Sector1Time / 1000,
          comparisonS2: comparisonLap.attributes_Sector2Time / 1000,
          comparisonS3: comparisonLap.attributes_Sector3Time / 1000
        });
      }
    }
    
    return gapData;
  };

  // Identify battles (when drivers are close to each other)
  const identifyBattles = (gapData) => {
    const battles = [];
    let currentBattle = null;
    
    gapData.forEach((lap, index) => {
      // Consider drivers in battle if they're within 2 positions and time gap is under 2 seconds
      const inBattle = Math.abs(lap.posGap) <= 2 && Math.abs(lap.timeGap) < 2;
      
      if (inBattle) {
        if (!currentBattle) {
          // Start new battle
          currentBattle = {
            startLap: lap.lap,
            endLap: lap.lap,
            intensity: Math.abs(lap.timeGap) < 1 ? 'high' : 'medium'
          };
        } else {
          // Continue battle
          currentBattle.endLap = lap.lap;
          // Update intensity if gap is very close
          if (Math.abs(lap.timeGap) < 1) {
            currentBattle.intensity = 'high';
          }
        }
      } else if (currentBattle) {
        // Battle ended
        battles.push(currentBattle);
        currentBattle = null;
      }
    });
    
    // Don't forget to add the last battle if it's still ongoing
    if (currentBattle) {
      battles.push(currentBattle);
    }
    
    return battles;
  };

  // Handle driver selection change
  const handleDriverChange = (event) => {
    const selectedDriverId = parseInt(event.target.value);
    const driver = drivers.find(d => d.participantid === selectedDriverId);
    setComparisonDriver(driver);
    setSelectedBattle(null); // Reset selected battle when changing drivers
  };
  
  // Handle battle selection
  const handleBattleSelect = (battle) => {
    setSelectedBattle(battle);
  };

  // Handle sector tab selection
  const handleSectorSelect = (sectorNumber) => {
    setSelectedSector(sectorNumber);
  };

  // Handle analysis mode change
  const handleAnalysisModeChange = (mode) => {
    setAnalysisMode(mode);
  };

  // Custom tooltip for gap chart
  const GapTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip bg-dark text-light p-2 rounded">
          <p className="mb-1"><strong>Lap {label}</strong></p>
          {/* <p className="mb-1">Time Gap: {payload[0].value.toFixed(3)}s</p> */}
          <p className="mb-0">
            {payload[0].value > 0 ? 
              `${comparisonDriver?.name} faster by ${Math.abs(payload[0].value).toFixed(3)}s` : 
              `${selectedDriver?.name} faster by ${Math.abs(payload[0].value).toFixed(3)}s`}
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="head-to-head-comparison mb-4">
      <div className="driver-selector mb-4">
        <Row className="align-items-end">
          <Col md={6} className="mb-3 mb-md-0">
            <h5 className="text-primary">Base Driver</h5>
            <div className="driver-card p-3 border rounded">
              <h6>{selectedDriver?.name}</h6>
              <div className="text-muted small">
                Finished P{selectedDriver?.RacePosition} • Best Lap: {msToTime(selectedDriver?.FastestLapTime)}
              </div>
            </div>
          </Col>
          <Col md={6}>
            <Form.Group>
              <h5 className="text-secondary">Comparison Driver</h5>
              <div className="d-flex">
                <Form.Select 
                  value={comparisonDriver?.participantid || ""}
                  onChange={handleDriverChange}
                  className="me-2"
                >
                  {drivers.map(driver => (
                    <option key={driver.participantid} value={driver.participantid}>
                      {driver.name} (P{driver.RacePosition})
                    </option>
                  ))}
                </Form.Select>
                <Button 
                  variant="outline-primary" 
                  onClick={loadDriverData}
                  disabled={isLoading || !comparisonDriver}
                >
                  {isLoading ? 'Loading...' : 'Compare'}
                </Button>
              </div>
            </Form.Group>
          </Col>
        </Row>
      </div>

      {/* Performance comparison statistics */}
      {primaryDriverData.length > 0 && comparisonDriverData.length > 0 && (
        <>
          <Card className="mb-4 comparison-stats-card">
            <Card.Header>
              <h5 className="mb-0">Driver Performance Comparison</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6} className="stats-column primary-stats border-end">
                  <h6 className="text-primary">{selectedDriver?.name}</h6>
                  <Table borderless size="sm" className="stats-table">
                    <tbody>
                      <tr>
                        <td>Best Lap:</td>
                        <td className="text-end fw-bold">{msToTime(stats.primary.bestLapTime)}</td>
                        <td>
                          {stats.primary.bestLapTime <= stats.comparison.bestLapTime ? 
                            <Badge bg="success">Faster</Badge> : 
                            <Badge bg="danger">+{msToTime(stats.primary.bestLapTime - stats.comparison.bestLapTime)}</Badge>
                          }
                        </td>
                      </tr>
                      <tr>
                        <td>Avg Lap:</td>
                        <td className="text-end fw-bold">{msToTime(stats.primary.avgLapTime)}</td>
                        <td>
                          {stats.primary.avgLapTime <= stats.comparison.avgLapTime ? 
                            <Badge bg="success">Faster</Badge> : 
                            <Badge bg="danger">+{msToTime(stats.primary.avgLapTime - stats.comparison.avgLapTime)}</Badge>
                          }
                        </td>
                      </tr>
                      <tr>
                        <td>Consistency:</td>
                        <td className="text-end fw-bold">{stats.primary.consistency}/10</td>
                        <td>
                          {stats.primary.consistency >= stats.comparison.consistency ? 
                            <Badge bg="success">Better</Badge> : 
                            <Badge bg="danger">Lower</Badge>
                          }
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
                
                <Col md={6} className="stats-column comparison-stats">
                  <h6 className="text-secondary">{comparisonDriver?.name}</h6>
                  <Table borderless size="sm" className="stats-table">
                    <tbody>
                      <tr>
                        <td>Best Lap:</td>
                        <td className="text-end fw-bold">{msToTime(stats.comparison.bestLapTime)}</td>
                        <td>
                          {stats.comparison.bestLapTime <= stats.primary.bestLapTime ? 
                            <Badge bg="success">Faster</Badge> : 
                            <Badge bg="danger">+{msToTime(stats.comparison.bestLapTime - stats.primary.bestLapTime)}</Badge>
                          }
                        </td>
                      </tr>
                      <tr>
                        <td>Avg Lap:</td>
                        <td className="text-end fw-bold">{msToTime(stats.comparison.avgLapTime)}</td>
                        <td>
                          {stats.comparison.avgLapTime <= stats.primary.avgLapTime ? 
                            <Badge bg="success">Faster</Badge> : 
                            <Badge bg="danger">+{msToTime(stats.comparison.avgLapTime - stats.primary.avgLapTime)}</Badge>
                          }
                        </td>
                      </tr>
                      <tr>
                        <td>Consistency:</td>
                        <td className="text-end fw-bold">{stats.comparison.consistency}/10</td>
                        <td>
                          {stats.comparison.consistency >= stats.primary.consistency ? 
                            <Badge bg="success">Better</Badge> : 
                            <Badge bg="danger">Lower</Badge>
                          }
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Body className="d-flex flex-wrap justify-content-between align-items-center py-2">
              <div className="mb-2 mb-md-0">
                <h6 className="mb-0">Graph Settings</h6>
              </div>
              <div className="d-flex align-items-center">
                <div className="mode-selector">
                  <ButtonGroup size="sm">
                    <Button
                      variant={analysisMode === 'all' ? 'primary' : 'outline-primary'}
                      onClick={() => handleAnalysisModeChange('all')}
                    >
                      All Laps
                    </Button>
                    <Button
                      variant={analysisMode === 'clean' ? 'primary' : 'outline-primary'}
                      onClick={() => handleAnalysisModeChange('clean')}
                    >
                      Exclude Pits
                    </Button>
                  </ButtonGroup>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Lap time comparison chart */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Lap Time Comparison</h5>
            </Card.Header>
            <Card.Body>
              <div style={{ height: "350px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={gapData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="lap" label={{ value: 'Lap Number', position: 'insideBottomRight', offset: -10 }} />
                    <YAxis 
                      label={{ value: 'Lap Time (sec)', angle: -90, position: 'insideLeft' }}
                      domain={['dataMin - 0.5', 'dataMax + 0.5']}
                    />
                    <Tooltip formatter={(value) => msToTime(value * 1000)} />
                    <Legend />
                    
                    <Line 
                      type="monotone" 
                      dataKey="primaryTime" 
                      stroke="#007bff" 
                      name={`${selectedDriver?.name}`} 
                      dot={{ r: 3 }} 
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="comparisonTime" 
                      stroke="#6f42c1" 
                      name={`${comparisonDriver?.name}`} 
                      dot={{ r: 3 }} 
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                    
                    {/* Show reference lines for battles */}
                    {battles.map((battle, idx) => (
                      <React.Fragment key={idx}>
                        <ReferenceLine 
                          x={battle.startLap} 
                          stroke="#ffc107" 
                          strokeDasharray="3 3" 
                          strokeWidth={battle.intensity === 'high' ? 2 : 1}
                        />
                        <ReferenceLine 
                          x={battle.endLap} 
                          stroke="#ffc107" 
                          strokeDasharray="3 3" 
                          strokeWidth={battle.intensity === 'high' ? 2 : 1}
                        />
                      </React.Fragment>
                    ))}
                    
                    {/* Highlight selected battle */}
                    {selectedBattle && (
                      <rect 
                        x={selectedBattle.startLap} 
                        y="0%" 
                        width={selectedBattle.endLap - selectedBattle.startLap} 
                        height="100%" 
                        fill="yellow" 
                        fillOpacity="0.1"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>

          {/* Gap visualization */}
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Performance Gap</h5>
              <div className="legend small text-muted">
                <span className="me-3">
                  <span className="color-dot positive-dot"></span> {selectedDriver?.name} faster
                </span>
                <span>
                  <span className="color-dot negative-dot"></span> {comparisonDriver?.name} faster
                </span>
              </div>
            </Card.Header>
            <Card.Body>
              <div style={{ height: "250px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={gapData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="lap" label={{ value: 'Lap Number', position: 'insideBottomRight', offset: -10 }} />
                    <YAxis 
                      label={{ value: 'Time Gap (sec)', angle: -90, position: 'insideLeft' }}
                      domain={[
                        dataMin => Math.min(-0.5, Math.floor(dataMin)),
                        dataMax => Math.max(0.5, Math.ceil(dataMax))
                      ]}
                    />
                    <Tooltip content={<GapTooltip />} />
                    <Legend />
                    <ReferenceLine y={0} stroke="#666" strokeWidth={1} />
                    <Line 
                      type="monotone" 
                      dataKey="timeGap" 
                      name="Time Gap" 
                      stroke="#ff7300" 
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        return (
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={3} 
                            fill={payload.timeGap <= 0 ? "#28a745" : "#dc3545"} 
                            stroke={payload.timeGap <= 0 ? "#28a745" : "#dc3545"} 
                          />
                        );
                      }}
                      strokeWidth={2}
                      activeDot={(props) => {
                        const { cx, cy, payload } = props;
                        return (
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={6} 
                            fill={payload.timeGap <= 0 ? "#28a745" : "#dc3545"} 
                            stroke={payload.timeGap <= 0 ? "#28a745" : "#dc3545"} 
                          />
                        );
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>

          {/* Sector comparison */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Sector Analysis</h5>
            </Card.Header>
            <Card.Body>
              <Nav variant="tabs" className="mb-3">
                <Nav.Item>
                  <Nav.Link 
                    active={selectedSector === 1} 
                    onClick={() => handleSectorSelect(1)}
                  >
                    Sector 1
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={selectedSector === 2} 
                    onClick={() => handleSectorSelect(2)}
                  >
                    Sector 2
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={selectedSector === 3} 
                    onClick={() => handleSectorSelect(3)}
                  >
                    Sector 3
                  </Nav.Link>
                </Nav.Item>
              </Nav>
              
              <div className="sector-analysis">
                {selectedSector === 1 && (
                  <div style={{ height: "250px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={gapData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="lap" label={{ value: 'Lap Number', position: 'insideBottomRight', offset: -10 }} />
                        <YAxis label={{ value: 'Sector 1 Time (sec)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value) => msToTime(value * 1000)} />
                        <Legend />
                        <Line type="monotone" dataKey="primaryS1" stroke="#007bff" name={selectedDriver?.name} />
                        <Line type="monotone" dataKey="comparisonS1" stroke="#6f42c1" name={comparisonDriver?.name} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {selectedSector === 2 && (
                  <div style={{ height: "250px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={gapData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="lap" label={{ value: 'Lap Number', position: 'insideBottomRight', offset: -10 }} />
                        <YAxis label={{ value: 'Sector 2 Time (sec)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value) => msToTime(value * 1000)} />
                        <Legend />
                        <Line type="monotone" dataKey="primaryS2" stroke="#007bff" name={selectedDriver?.name} />
                        <Line type="monotone" dataKey="comparisonS2" stroke="#6f42c1" name={comparisonDriver?.name} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {selectedSector === 3 && (
                  <div style={{ height: "250px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={gapData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="lap" label={{ value: 'Lap Number', position: 'insideBottomRight', offset: -10 }} />
                        <YAxis label={{ value: 'Sector 3 Time (sec)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value) => msToTime(value * 1000)} />
                        <Legend />
                        <Line type="monotone" dataKey="primaryS3" stroke="#007bff" name={selectedDriver?.name} />
                        <Line type="monotone" dataKey="comparisonS3" stroke="#6f42c1" name={comparisonDriver?.name} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          
          {/* Battle timeline */}
          {battles.length > 0 && (
            <Card className="mb-4 battle-card">
              <Card.Header>
                <h5 className="mb-0">Battle Timeline</h5>
              </Card.Header>
              <Card.Body>
                <div className="battles-container">
                  {battles.map((battle, idx) => (
                    <Button
                      key={idx}
                      variant={selectedBattle === battle ? "primary" : "outline-primary"}
                      className={`battle-btn mb-2 me-2 ${battle.intensity === 'high' ? 'high-intensity' : ''}`}
                      onClick={() => handleBattleSelect(battle)}
                    >
                      Laps {battle.startLap}-{battle.endLap}
                      {battle.intensity === 'high' && (
                        <Badge bg="danger" className="ms-2">Intense</Badge>
                      )}
                    </Button>
                  ))}
                  
                  {selectedBattle && (
                    <div className="battle-details mt-3 p-3 border rounded">
                      <h6>Battle Analysis: Laps {selectedBattle.startLap}-{selectedBattle.endLap}</h6>
                      <p className="mb-2">
                        <strong>Duration:</strong> {selectedBattle.endLap - selectedBattle.startLap + 1} laps
                        <span className="ms-2">
                          <Badge bg={selectedBattle.intensity === 'high' ? "danger" : "warning"}>
                            {selectedBattle.intensity === 'high' ? 'High Intensity' : 'Medium Intensity'}
                          </Badge>
                        </span>
                      </p>
                      <div className="battle-laps">
                        <Table size="sm" className="mb-0">
                          <thead>
                            <tr>
                              <th>Lap</th>
                              <th>{selectedDriver?.name}</th>
                              <th>{comparisonDriver?.name}</th>
                              <th>Gap</th>
                              <th>Positions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {gapData
                              .filter(lap => lap.lap >= selectedBattle.startLap && lap.lap <= selectedBattle.endLap)
                              .map(lap => (
                                <tr key={lap.lap}>
                                  <td>{lap.lap}</td>
                                  <td>{msToTime(lap.primaryTime * 1000)}</td>
                                  <td>{msToTime(lap.comparisonTime * 1000)}</td>
                                  <td className={lap.timeGap > 0 ? 'text-danger' : 'text-success'}>
                                    {lap.timeGap > 0 ? '+' : ''}{lap.timeGap.toFixed(3)}s
                                  </td>
                                  <td>
                                    P{lap.primaryPos} vs P{lap.comparisonPos}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  )}
                  
                  {battles.length > 0 && !selectedBattle && (
                    <div className="text-muted mt-2">
                      Select a battle to see detailed comparison
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default SessionHistoryHeadToHeadComparison;