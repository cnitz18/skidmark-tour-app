import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Badge, Table, ButtonGroup, Spinner } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';
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
  const [analysisMode, setAnalysisMode] = useState('clean'); // 'all' or 'clean'
  const [battleGapThreshold, setBattleGapThreshold] = useState(2.0);
  const [primaryPitLaps, setPrimaryPitLaps] = useState({ in: [], out: [] });
  const [comparisonPitLaps, setComparisonPitLaps] = useState({ in: [], out: [] });

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
  }, [primaryDriverData, comparisonDriverData, analysisMode, battleGapThreshold]);

  // Load data for both selected drivers
  const loadDriverData = async () => {
    setIsLoading(true);
    setPrimaryDriverData([]);
    setComparisonDriverData([]);
    setGapData([]);
    setBattles([]);
    setSelectedBattle(null);
    
    try {
      // Fetch both drivers in parallel to avoid staggered UI updates
      const [primaryData, comparisonData] = await Promise.all([
        getStandardizedEventData(selectedDriver.stage, selectedDriver.participantid),
        getStandardizedEventData(comparisonDriver.stage, comparisonDriver.participantid)
      ]);

      setPrimaryDriverData(primaryData);
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

    // Store pit lap data for table rendering
    setPrimaryPitLaps(primaryPitLaps);
    setComparisonPitLaps(comparisonPitLaps);

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
    const battlePeriods = identifyBattles(gapsByLap, battleGapThreshold);
    setBattles(battlePeriods);

    if (selectedBattle) {
      const stillExists = battlePeriods.some((battle) =>
        battle.startLap === selectedBattle.startLap && battle.endLap === selectedBattle.endLap
      );
      if (!stillExists) {
        setSelectedBattle(null);
      }
    }
  };

  // Calculate statistics for a driver
  const calculateDriverStats = (laps) => {
    if (!laps.length) return { avgLapTime: 0, bestLapTime: 0, consistency: 0, lapSpread: 0 };

    const lapTimes = laps
      .map((lap) => lap.attributes_LapTime)
      .filter((time) => Number.isFinite(time) && time > 0);

    if (!lapTimes.length) return { avgLapTime: 0, bestLapTime: 0, consistency: 0, lapSpread: 0 };

    const avgLapTime = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
    const bestLapTime = Math.min(...lapTimes);

    const variance = lapTimes.reduce((sum, time) => sum + Math.pow(time - avgLapTime, 2), 0) / lapTimes.length;
    const stdDev = Math.sqrt(variance);
    const cv = avgLapTime ? stdDev / avgLapTime : 0;
    const calculatedConsistency = parseFloat((10 - Math.min(10, cv * 100)).toFixed(1));

    const driverData = driverAnalytics[laps[0].participantid];
    const consistency = Number.isFinite(parseFloat(driverData?.consistency))
      ? parseFloat(driverData.consistency)
      : calculatedConsistency;

    return {
      avgLapTime,
      bestLapTime,
      consistency,
      lapSpread: avgLapTime - bestLapTime
    };
  };

  const formatLapTimeSafe = (value) => {
    if (!Number.isFinite(value) || value <= 0) return '--';
    return msToTime(Math.round(value));
  };

  // Generate gap data between drivers for each lap
  const generateGapData = (primaryLaps, comparisonLaps) => {
    const maxLaps = Math.max(
      primaryLaps.length > 0 ? primaryLaps[primaryLaps.length - 1].attributes_Lap : 0,
      comparisonLaps.length > 0 ? comparisonLaps[comparisonLaps.length - 1].attributes_Lap : 0
    );
    
    const gapData = [];
    let cumulativeGap = 0;
    
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
        
        cumulativeGap += timeGap;

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
          comparisonS3: comparisonLap.attributes_Sector3Time / 1000,
          cumulativeGap
        });
      }
    }
    
    return gapData;
  };

  // Identify battles (when drivers are close to each other)
  const identifyBattles = (gapData, thresholdSeconds) => {
    const battles = [];
    let currentBattle = null;
    
    gapData.forEach((lap) => {
      // Exclude lap 1 — track position spread is expected at race start
      if (lap.lap <= 1) return;

      // Use cumulative gap (approximation of real on-track separation)
      const inBattle = Math.abs(lap.cumulativeGap) < thresholdSeconds;

      if (inBattle) {
        if (!currentBattle) {
          // Start new battle
          currentBattle = {
            startLap: lap.lap,
            endLap: lap.lap,
            minGap: Math.abs(lap.cumulativeGap)
          };
        } else {
          // Continue battle
          currentBattle.endLap = lap.lap;
          currentBattle.minGap = Math.min(currentBattle.minGap, Math.abs(lap.cumulativeGap));
        }
      } else if (currentBattle) {
        // Battle ended — only record if it lasted at least 2 laps
        if (currentBattle.endLap - currentBattle.startLap >= 1) {
          battles.push({
            ...currentBattle,
            intensity: currentBattle.minGap < 0.5 ? 'high' : 'medium'
          });
        }
        currentBattle = null;
      }
    });
    
    // Don't forget to add the last battle if it's still ongoing
    if (currentBattle) {
      if (currentBattle.endLap - currentBattle.startLap >= 1) {
        battles.push({
          ...currentBattle,
          intensity: currentBattle.minGap < 0.5 ? 'high' : 'medium'
        });
      }
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

  const handleBattleThresholdChange = (event) => {
    setBattleGapThreshold(parseFloat(event.target.value));
  };

  const renderStatRow = (label, primaryValue, comparisonValue, formatter, lowerIsBetter = true) => {
    const primaryWins = lowerIsBetter ? primaryValue <= comparisonValue : primaryValue >= comparisonValue;
    const delta = Math.abs(primaryValue - comparisonValue);

    return (
      <div className="h2h-stat-row" key={label}>
        <div className={`h2h-stat-value ${primaryWins ? 'winner' : 'loser'}`}>
          <div>{formatter(primaryValue)}</div>
          {!primaryWins && <small className="h2h-stat-delta">+{formatter(delta)}</small>}
        </div>
        <div className="h2h-stat-label">{label}</div>
        <div className={`h2h-stat-value ${!primaryWins ? 'winner' : 'loser'}`}>
          <div>{formatter(comparisonValue)}</div>
          {primaryWins && <small className="h2h-stat-delta">+{formatter(delta)}</small>}
        </div>
      </div>
    );
  };

  const formatTimeGap = (value) => {
    if (!Number.isFinite(value)) return '--';
    return `${value >= 0 ? '+' : ''}${value.toFixed(3)}s`;
  };

  const getPitIndicator = (lapNum, isPrimaryDriver) => {
    const pitLaps = isPrimaryDriver ? primaryPitLaps : comparisonPitLaps;
    if (pitLaps.in.includes(lapNum)) {
      return <span className="pit-indicator pit-in" style={{ marginLeft: '4px', display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ff4444' }} title="Pit-in lap" />;
    }
    if (pitLaps.out.includes(lapNum)) {
      return <span className="pit-indicator pit-out" style={{ marginLeft: '4px', display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ffaa00' }} title="Pit-out lap" />;
    }
    return null;
  };

  const lapTimeTooltipFormatter = (value, name, entry) => {
    if (name === selectedDriver?.name || name === comparisonDriver?.name) {
      return [msToTime(Math.round(value * 1000)), name];
    }

    if (name === 'Gap') {
      const gap = entry?.payload?.timeGap;
      const fasterDriver = gap <= 0 ? selectedDriver?.name : comparisonDriver?.name;
      return [`${formatTimeGap(gap)} (${fasterDriver} faster)`, name];
    }

    return [value, name];
  };
  
  return (
    <div className="head-to-head-comparison mb-4">
      <div className="driver-selector mb-4">
        <div className="driver-compare-header">
          <div className="driver-card p-3 rounded h2h-driver-primary">
            <div className="h2h-driver-title">Primary</div>
            <h6 className="mb-1">{selectedDriver?.name}</h6>
            <div className="text-muted small">
              P{selectedDriver?.RacePosition} • Fastest: {msToTime(selectedDriver?.FastestLapTime)}
            </div>
          </div>

          <div className="h2h-vs">VS</div>

          <div className="driver-card p-3 rounded h2h-driver-comparison">
            <div className="h2h-driver-title">Comparison</div>
            <Form.Select
              size="sm"
              value={comparisonDriver?.participantid || ""}
              onChange={handleDriverChange}
              className="mb-2 compare-driver-select"
            >
              {drivers.map(driver => (
                <option key={driver.participantid} value={driver.participantid}>
                  {driver.name} (P{driver.RacePosition})
                </option>
              ))}
            </Form.Select>
            <div className="text-muted small">
              P{comparisonDriver?.RacePosition || '--'} • Fastest: {comparisonDriver?.FastestLapTime ? msToTime(comparisonDriver.FastestLapTime) : '--'}
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <Card className="mb-4">
          <Card.Body className="text-center py-5">
            <Spinner animation="border" role="status" variant="primary" />
            <div className="mt-3 text-muted">Loading comparison data...</div>
          </Card.Body>
        </Card>
      )}

      {!isLoading && primaryDriverData.length > 0 && comparisonDriverData.length > 0 && (
        <>
          <Card className="mb-4 comparison-stats-card">
            <Card.Header className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <h5 className="mb-0">Driver Performance Comparison</h5>
              <ButtonGroup size="sm" className="h2h-segmented">
                <Button
                  variant="light"
                  className={`h2h-segmented-btn ${analysisMode === 'all' ? 'active' : ''}`}
                  onClick={() => handleAnalysisModeChange('all')}
                >
                  All Laps
                </Button>
                <Button
                  variant="light"
                  className={`h2h-segmented-btn ${analysisMode === 'clean' ? 'active' : ''}`}
                  onClick={() => handleAnalysisModeChange('clean')}
                >
                  Exclude Pits
                </Button>
              </ButtonGroup>
            </Card.Header>
            <Card.Body>
              <div className="h2h-stat-grid">
                {renderStatRow('Fastest Lap', stats.primary.bestLapTime, stats.comparison.bestLapTime, formatLapTimeSafe)}
                {renderStatRow('Avg Lap', stats.primary.avgLapTime, stats.comparison.avgLapTime, formatLapTimeSafe)}
                {renderStatRow('Pace Spread', stats.primary.lapSpread, stats.comparison.lapSpread, formatLapTimeSafe)}
              </div>
              <div className="h2h-stat-footnote mt-2 text-muted small">
                Pace Spread = average lap time minus best lap time. Lower values indicate more repeatable pace.
              </div>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Lap Time Comparison</h5>
            </Card.Header>
            <Card.Body>
              <div style={{ height: "340px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={gapData}
                    margin={{ top: 5, right: 24, left: 8, bottom: 18 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="lap" />
                    <YAxis
                      yAxisId="lapAxis"
                      width={70}
                      domain={[
                        (dataMin) => dataMin - 0.25,
                        (dataMax) => dataMax + 0.25
                      ]}
                    />
                    <YAxis yAxisId="gapAxis" hide domain={['auto', 'auto']} />
                    <Tooltip
                      labelFormatter={(label) => `Lap ${label}`}
                      formatter={lapTimeTooltipFormatter}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="primaryTime"
                      yAxisId="lapAxis"
                      stroke="#00a8e1"
                      name={selectedDriver?.name}
                      dot={false}
                      strokeWidth={2}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="comparisonTime"
                      yAxisId="lapAxis"
                      stroke="#f7a800"
                      name={comparisonDriver?.name}
                      dot={false}
                      strokeWidth={2}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="timeGap"
                      yAxisId="gapAxis"
                      stroke="transparent"
                      name="Gap"
                      dot={false}
                      activeDot={false}
                    />
                    {selectedBattle && (
                      <>
                        <ReferenceLine yAxisId="lapAxis" x={selectedBattle.startLap} stroke="#fd7e14" strokeDasharray="4 4" />
                        <ReferenceLine yAxisId="lapAxis" x={selectedBattle.endLap} stroke="#fd7e14" strokeDasharray="4 4" />
                      </>
                    )}
                    {primaryPitLaps.in.map((lapNum) => {
                      const lapData = gapData.find(d => d.lap === lapNum);
                      return lapData ? <ReferenceDot key={`primary-pit-in-${lapNum}`} x={lapNum} y={lapData.primaryTime} yAxisId="lapAxis" r={5} fill="#ff4444" stroke="#cc0000" ifOverflow="visible" /> : null;
                    })}
                    {primaryPitLaps.out.map((lapNum) => {
                      const lapData = gapData.find(d => d.lap === lapNum);
                      return lapData ? <ReferenceDot key={`primary-pit-out-${lapNum}`} x={lapNum} y={lapData.primaryTime} yAxisId="lapAxis" r={5} fill="#ffaa00" stroke="#ff8800" ifOverflow="visible" /> : null;
                    })}
                    {comparisonPitLaps.in.map((lapNum) => {
                      const lapData = gapData.find(d => d.lap === lapNum);
                      return lapData ? <ReferenceDot key={`comparison-pit-in-${lapNum}`} x={lapNum} y={lapData.comparisonTime} yAxisId="lapAxis" r={5} fill="#ff4444" stroke="#cc0000" ifOverflow="visible" /> : null;
                    })}
                    {comparisonPitLaps.out.map((lapNum) => {
                      const lapData = gapData.find(d => d.lap === lapNum);
                      return lapData ? <ReferenceDot key={`comparison-pit-out-${lapNum}`} x={lapNum} y={lapData.comparisonTime} yAxisId="lapAxis" r={5} fill="#ffaa00" stroke="#ff8800" ifOverflow="visible" /> : null;
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Sector Analysis</h5>
              <ButtonGroup size="sm" className="h2h-segmented">
                <Button
                  variant="light"
                  className={`h2h-segmented-btn ${selectedSector === 1 ? 'active' : ''}`}
                  onClick={() => handleSectorSelect(1)}
                >
                  S1
                </Button>
                <Button
                  variant="light"
                  className={`h2h-segmented-btn ${selectedSector === 2 ? 'active' : ''}`}
                  onClick={() => handleSectorSelect(2)}
                >
                  S2
                </Button>
                <Button
                  variant="light"
                  className={`h2h-segmented-btn ${selectedSector === 3 ? 'active' : ''}`}
                  onClick={() => handleSectorSelect(3)}
                >
                  S3
                </Button>
              </ButtonGroup>
            </Card.Header>
            <Card.Body>
              <div className="sector-analysis" style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={gapData}
                    margin={{ top: 5, right: 24, left: 8, bottom: 18 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="lap" />
                    <YAxis
                      width={64}
                      domain={[
                        (dataMin) => dataMin - 0.1,
                        (dataMax) => dataMax + 0.1
                      ]}
                    />
                    <Tooltip
                      labelFormatter={(label) => `Lap ${label}`}
                      formatter={(value) => msToTime(Math.round(value * 1000))}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey={`primaryS${selectedSector}`}
                      stroke="#00a8e1"
                      name={selectedDriver?.name}
                      dot={false}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey={`comparisonS${selectedSector}`}
                      stroke="#f7a800"
                      name={comparisonDriver?.name}
                      dot={false}
                      strokeWidth={2}
                    />
                    {primaryPitLaps.in.map((lapNum) => {
                      const lapData = gapData.find(d => d.lap === lapNum);
                      return lapData ? <ReferenceDot key={`s-primary-pit-in-${lapNum}`} x={lapNum} y={lapData[`primaryS${selectedSector}`]} r={5} fill="#ff4444" stroke="#cc0000" ifOverflow="visible" /> : null;
                    })}
                    {primaryPitLaps.out.map((lapNum) => {
                      const lapData = gapData.find(d => d.lap === lapNum);
                      return lapData ? <ReferenceDot key={`s-primary-pit-out-${lapNum}`} x={lapNum} y={lapData[`primaryS${selectedSector}`]} r={5} fill="#ffaa00" stroke="#ff8800" ifOverflow="visible" /> : null;
                    })}
                    {comparisonPitLaps.in.map((lapNum) => {
                      const lapData = gapData.find(d => d.lap === lapNum);
                      return lapData ? <ReferenceDot key={`s-comparison-pit-in-${lapNum}`} x={lapNum} y={lapData[`comparisonS${selectedSector}`]} r={5} fill="#ff4444" stroke="#cc0000" ifOverflow="visible" /> : null;
                    })}
                    {comparisonPitLaps.out.map((lapNum) => {
                      const lapData = gapData.find(d => d.lap === lapNum);
                      return lapData ? <ReferenceDot key={`s-comparison-pit-out-${lapNum}`} x={lapNum} y={lapData[`comparisonS${selectedSector}`]} r={5} fill="#ffaa00" stroke="#ff8800" ifOverflow="visible" /> : null;
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>

          <Card className="mb-4 battle-card">
            <Card.Header className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <h5 className="mb-0">Battle Timeline</h5>
              <div className="battle-threshold-control">
                <span className="small text-muted me-2">Gap Threshold</span>
                <Form.Range
                  min={0.5}
                  max={5}
                  step={0.1}
                  value={battleGapThreshold}
                  onChange={handleBattleThresholdChange}
                />
                <span className="battle-threshold-value">{battleGapThreshold.toFixed(1)}s</span>
              </div>
            </Card.Header>
              <Card.Body>
                <div className="battles-container">
                  {battles.map((battle, idx) => (
                    <Button
                      key={idx}
                      variant={selectedBattle === battle ? 'primary' : 'outline-primary'}
                      className={`battle-btn mb-2 me-2 ${battle.intensity === 'high' ? 'high-intensity' : ''}`}
                      onClick={() => handleBattleSelect(battle)}
                    >
                      Laps {battle.startLap}-{battle.endLap}
                      <Badge bg={battle.intensity === 'high' ? 'danger' : 'warning'} className="ms-2">
                        Closest: {battle.minGap.toFixed(2)}s
                      </Badge>
                    </Button>
                  ))}

                  {selectedBattle && (
                    <div className="battle-details mt-3 p-3 border rounded">
                      <h6>Battle Analysis: Laps {selectedBattle.startLap}-{selectedBattle.endLap}</h6>
                      <p className="mb-2">
                        <strong>Duration:</strong> {selectedBattle.endLap - selectedBattle.startLap + 1} laps
                        <span className="ms-2">
                          <Badge bg={selectedBattle.intensity === 'high' ? 'danger' : 'warning'}>
                            Closest approach: {selectedBattle.minGap.toFixed(2)}s
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
                              <th>Lap Delta</th>
                              <th>Track Gap</th>
                              <th>Positions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {gapData
                              .filter((lap) => lap.lap >= selectedBattle.startLap && lap.lap <= selectedBattle.endLap)
                              .map((lap) => (
                                <tr key={lap.lap}>
                                  <td>{lap.lap}</td>
                                  <td>{msToTime(Math.round(lap.primaryTime * 1000))}{getPitIndicator(lap.lap, true)}</td>
                                  <td>{msToTime(Math.round(lap.comparisonTime * 1000))}{getPitIndicator(lap.lap, false)}</td>
                                  <td className={lap.timeGap > 0 ? 'text-danger' : 'text-success'}>
                                    {formatTimeGap(lap.timeGap)}
                                  </td>
                                  <td className={lap.cumulativeGap > 0 ? 'text-danger' : 'text-success'}>
                                    {formatTimeGap(lap.cumulativeGap)}
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
                    <div className="text-muted mt-2">Select a battle to see detailed comparison</div>
                  )}

                  {battles.length === 0 && (
                    <div className="battle-empty-state text-muted">
                      No battles found at {battleGapThreshold.toFixed(1)}s. Increase the threshold to surface looser battles.
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
        </>
      )}
    </div>
  );
};

export default SessionHistoryHeadToHeadComparison;