import React, { useState, useEffect, useMemo } from 'react';
import { Form, Button, Card, Table, ButtonGroup, Spinner } from 'react-bootstrap';
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
  const [gapData, setGapData] = useState([]);
  const [stats, setStats] = useState({
    primary: { avgLapTime: 0, bestLapTime: 0, consistency: 0 },
    comparison: { avgLapTime: 0, bestLapTime: 0, consistency: 0 }
  });
  const [selectedSector, setSelectedSector] = useState(1);
  const [analysisMode, setAnalysisMode] = useState('clean'); // 'all' or 'clean'
  const [chartMode, setChartMode] = useState('lapTime'); // 'lapTime' | 'trackGap'
  const [primaryPitLaps, setPrimaryPitLaps] = useState({ in: [], out: [] });
  const [comparisonPitLaps, setComparisonPitLaps] = useState({ in: [], out: [] });
  const [expandedLaps, setExpandedLaps] = useState(new Set());

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
  }, [primaryDriverData, comparisonDriverData, analysisMode]);

  // Load data for both selected drivers
  const loadDriverData = async () => {
    setIsLoading(true);
    setPrimaryDriverData([]);
    setComparisonDriverData([]);
    setGapData([]);

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
        !primaryPitLaps.in.includes(lap.attributes_Lap) && 
        !primaryPitLaps.out.includes(lap.attributes_Lap)
      );
      
      filteredComparisonLaps = comparisonLaps.filter(lap => 
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
          cumulativeGap,
          primaryAheadGap: cumulativeGap <= 0 ? cumulativeGap : null,
          comparisonAheadGap: cumulativeGap >= 0 ? cumulativeGap : null,
        });
      }
    }
    
    return gapData;
  };

  // Handle driver selection change
  const handleDriverChange = (event) => {
    const selectedDriverId = parseInt(event.target.value);
    const driver = drivers.find(d => d.participantid === selectedDriverId);
    setComparisonDriver(driver);
  };
  
  const toggleLapExpand = (lapNum) => {
    setExpandedLaps(prev => {
      const next = new Set(prev);
      next.has(lapNum) ? next.delete(lapNum) : next.add(lapNum);
      return next;
    });
  };

  // Handle sector tab selection
  const handleSectorSelect = (sectorNumber) => {
    setSelectedSector(sectorNumber);
  }

  // Handle analysis mode change
  const handleAnalysisModeChange = (mode) => {
    setAnalysisMode(mode);
  };

  const handleChartModeChange = (mode) => {
    setChartMode(mode);
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

  const renderChartLegend = (props) => {
    const { payload } = props;
    const hasPitIn = primaryPitLaps.in.length > 0 || comparisonPitLaps.in.length > 0;
    const hasPitOut = primaryPitLaps.out.length > 0 || comparisonPitLaps.out.length > 0;
    const showPitLegend = analysisMode === 'all' && (hasPitIn || hasPitOut);

    return (
      <ul style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', margin: 0, padding: 0, listStyle: 'none', fontSize: '0.85rem' }}>
        {chartMode === 'trackGap' ? (
          <>
            <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: 16, height: 3, background: '#00a8e1', borderRadius: 2 }} />
              {selectedDriver?.name} ahead
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: 16, height: 3, background: '#f7a800', borderRadius: 2 }} />
              {comparisonDriver?.name} ahead
            </li>
          </>
        ) : (
          payload
            .filter(entry => entry.value !== 'Gap')
            .map((entry, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: 16, height: 3, background: entry.color, borderRadius: 2 }} />
                {entry.value}
              </li>
            ))
        )}
        {showPitLegend && hasPitIn && (
          <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, background: '#ff4444', borderRadius: '50%' }} />
            Pit-in
          </li>
        )}
        {showPitLegend && hasPitOut && (
          <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, background: '#ffaa00', borderRadius: '50%' }} />
            Pit-out
          </li>
        )}
      </ul>
    );
  };

  const gapTooltipFormatter = (value, name) => {
    if (value === null || value === undefined) return null;
    if (value === 0) return ['Even', 'Track Gap'];
    const formatted = value > 0 ? `+${value.toFixed(3)}s` : `${value.toFixed(3)}s`;
    return [formatted, 'Track Gap'];
  };

  // Chart data for track gap mode: inserts interpolated crossing points so the
  // blue/yellow segments share a y=0 endpoint and the line stays continuous.
  const chartGapData = useMemo(() => {
    if (!gapData.length) return [];
    const result = [];
    for (let i = 0; i < gapData.length; i++) {
      const d = gapData[i];
      const prev = gapData[i - 1];
      if (prev && prev.cumulativeGap * d.cumulativeGap < 0) {
        const t = Math.abs(prev.cumulativeGap) / (Math.abs(prev.cumulativeGap) + Math.abs(d.cumulativeGap));
        result.push({
          lap: prev.lap + t,
          cumulativeGap: 0,
          primaryAheadGap: 0,
          comparisonAheadGap: 0,
        });
      }
      result.push({
        ...d,
        primaryAheadGap: d.cumulativeGap <= 0 ? d.cumulativeGap : null,
        comparisonAheadGap: d.cumulativeGap >= 0 ? d.cumulativeGap : null,
      });
    }
    return result;
  }, [gapData]);

  return (
    <div className="head-to-head-comparison mb-4">

      <div className="h2h-tab-toolbar d-flex">
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
            <Card.Body className="p-0">
              <div className="h2h-stat-grid">
                <div className="h2h-stat-row h2h-header-row">
                  <div className="h2h-stat-value h2h-col-header">
                    <div className="h2h-col-label">Primary</div>
                    <strong className="h2h-col-name">{selectedDriver?.name}</strong>
                  </div>
                  <div className="h2h-stat-label" />
                  <div className="h2h-stat-value h2h-col-header">
                    <div className="h2h-col-label">Compare with</div>
                    <Form.Select
                      size="sm"
                      value={comparisonDriver?.participantid || ""}
                      onChange={handleDriverChange}
                      className="compare-driver-select"
                    >
                      {drivers.map(driver => (
                        <option key={driver.participantid} value={driver.participantid}>
                          {driver.name} (P{driver.RacePosition})
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </div>
                {renderStatRow('Fastest Lap', stats.primary.bestLapTime, stats.comparison.bestLapTime, formatLapTimeSafe)}
                {renderStatRow('Avg Lap', stats.primary.avgLapTime, stats.comparison.avgLapTime, formatLapTimeSafe)}
                {renderStatRow('Pace Spread', stats.primary.lapSpread, stats.comparison.lapSpread, formatLapTimeSafe)}
              </div>
              <div className="h2h-stat-footnote text-muted small">
                Pace Spread = average lap time minus best lap time. Lower values indicate more repeatable pace.
              </div>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Lap Time Comparison</h5>
              <span className="d-none d-md-flex">
                <ButtonGroup size="sm" className="h2h-segmented">
                  <Button
                    variant="light"
                    className={`h2h-segmented-btn ${chartMode === 'lapTime' ? 'active' : ''}`}
                    onClick={() => handleChartModeChange('lapTime')}
                  >
                    Lap Time
                  </Button>
                  <Button
                    variant="light"
                    className={`h2h-segmented-btn ${chartMode === 'trackGap' ? 'active' : ''}`}
                    onClick={() => handleChartModeChange('trackGap')}
                  >
                    On-Track Gap
                  </Button>
                </ButtonGroup>
              </span>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="lap-chart-area d-none d-md-block">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartMode === 'trackGap' ? chartGapData : gapData}
                    margin={{ top: 5, right: 24, left: 8, bottom: 18 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="lap"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      ticks={gapData.map(d => d.lap)}
                      allowDecimals={false}
                    />
                    <YAxis
                      yAxisId="lapAxis"
                      width={70}
                      hide={chartMode !== 'lapTime'}
                      domain={[
                        (dataMin) => dataMin - 0.25,
                        (dataMax) => dataMax + 0.25
                      ]}
                    />
                    <YAxis
                      yAxisId="gapAxis"
                      width={70}
                      hide={chartMode !== 'trackGap'}
                      tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}s`}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length || !Number.isInteger(Number(label))) return null;
                        if (chartMode === 'lapTime') {
                          const driverEntries = payload.filter(e => e.name !== 'Gap' && e.value != null);
                          if (!driverEntries.length) return null;
                          const gapValue = payload.find(e => e.name === 'Gap')?.payload?.timeGap;
                          return (
                            <div className="custom-tooltip card p-2">
                              <p className="mb-1 fw-bold small">Lap {label}</p>
                              {driverEntries.map((entry, i) => {
                                const [val] = lapTimeTooltipFormatter(entry.value, entry.name, entry);
                                return <p key={i} className="mb-0 small" style={{ color: entry.color }}>{entry.name}: {val}</p>;
                              })}
                              {gapValue != null && (
                                <p className="mb-0 small" style={{ color: gapValue <= 0 ? '#00a8e1' : '#f7a800' }}>
                                  {formatTimeGap(gapValue)}
                                </p>
                              )}
                            </div>
                          );
                        }
                        const entries = payload.filter(e => e.value !== null && e.value !== undefined);
                        if (!entries.length) return null;
                        return (
                          <div className="custom-tooltip card p-2">
                            <p className="mb-1 fw-bold small">Lap {label}</p>
                            {entries.map((entry, i) => {
                              const result = gapTooltipFormatter(entry.value, entry.name);
                              if (!result) return null;
                              const [val, name] = Array.isArray(result) ? result : [result, entry.name];
                              return <p key={i} className="mb-0 small" style={{ color: entry.color }}>{name}: {val}</p>;
                            })}
                          </div>
                        );
                      }}
                    />
                    <Legend content={renderChartLegend} />
                    {chartMode === 'lapTime' && (
                      <>
                        <Line type="monotone" dataKey="primaryTime" yAxisId="lapAxis" stroke="#00a8e1" name={selectedDriver?.name} dot={false} strokeWidth={2} activeDot={{ r: 4 }} />
                        <Line type="monotone" dataKey="comparisonTime" yAxisId="lapAxis" stroke="#f7a800" name={comparisonDriver?.name} dot={false} strokeWidth={2} activeDot={{ r: 4 }} />
                        <Line type="monotone" dataKey="timeGap" yAxisId="gapAxis" stroke="transparent" name="Gap" dot={false} activeDot={false} />
                        {primaryPitLaps.in.map((lapNum) => { const lapData = gapData.find(d => d.lap === lapNum); return lapData ? <ReferenceDot key={`primary-pit-in-${lapNum}`} x={lapNum} y={lapData.primaryTime} yAxisId="lapAxis" r={5} fill="#ff4444" stroke="#cc0000" ifOverflow="visible" /> : null; })}
                        {primaryPitLaps.out.map((lapNum) => { const lapData = gapData.find(d => d.lap === lapNum); return lapData ? <ReferenceDot key={`primary-pit-out-${lapNum}`} x={lapNum} y={lapData.primaryTime} yAxisId="lapAxis" r={5} fill="#ffaa00" stroke="#ff8800" ifOverflow="visible" /> : null; })}
                        {comparisonPitLaps.in.map((lapNum) => { const lapData = gapData.find(d => d.lap === lapNum); return lapData ? <ReferenceDot key={`comparison-pit-in-${lapNum}`} x={lapNum} y={lapData.comparisonTime} yAxisId="lapAxis" r={5} fill="#ff4444" stroke="#cc0000" ifOverflow="visible" /> : null; })}
                        {comparisonPitLaps.out.map((lapNum) => { const lapData = gapData.find(d => d.lap === lapNum); return lapData ? <ReferenceDot key={`comparison-pit-out-${lapNum}`} x={lapNum} y={lapData.comparisonTime} yAxisId="lapAxis" r={5} fill="#ffaa00" stroke="#ff8800" ifOverflow="visible" /> : null; })}
                      </>
                    )}
                    {chartMode === 'trackGap' && (
                      <>
                        <Line type="monotone" dataKey="primaryAheadGap" yAxisId="gapAxis" stroke="#00a8e1" name={selectedDriver?.name} dot={false} strokeWidth={2} activeDot={{ r: 4 }} connectNulls={false} />
                        <Line type="monotone" dataKey="comparisonAheadGap" yAxisId="gapAxis" stroke="#f7a800" name={comparisonDriver?.name} dot={false} strokeWidth={2} activeDot={{ r: 4 }} connectNulls={false} />
                        <ReferenceLine yAxisId="gapAxis" y={0} stroke="#ffffff" strokeWidth={3} strokeOpacity={0.95} ifOverflow="visible" />
                        {primaryPitLaps.in.map((lapNum) => { const lapData = gapData.find(d => d.lap === lapNum); return lapData ? <ReferenceDot key={`primary-pit-in-${lapNum}`} x={lapNum} y={lapData.cumulativeGap} yAxisId="gapAxis" r={5} fill="#ff4444" stroke="#cc0000" ifOverflow="visible" /> : null; })}
                        {primaryPitLaps.out.map((lapNum) => { const lapData = gapData.find(d => d.lap === lapNum); return lapData ? <ReferenceDot key={`primary-pit-out-${lapNum}`} x={lapNum} y={lapData.cumulativeGap} yAxisId="gapAxis" r={5} fill="#ffaa00" stroke="#ff8800" ifOverflow="visible" /> : null; })}
                        {comparisonPitLaps.in.map((lapNum) => { const lapData = gapData.find(d => d.lap === lapNum); return lapData ? <ReferenceDot key={`comparison-pit-in-${lapNum}`} x={lapNum} y={lapData.cumulativeGap} yAxisId="gapAxis" r={5} fill="#ff4444" stroke="#cc0000" ifOverflow="visible" /> : null; })}
                        {comparisonPitLaps.out.map((lapNum) => { const lapData = gapData.find(d => d.lap === lapNum); return lapData ? <ReferenceDot key={`comparison-pit-out-${lapNum}`} x={lapNum} y={lapData.cumulativeGap} yAxisId="gapAxis" r={5} fill="#ffaa00" stroke="#ff8800" ifOverflow="visible" /> : null; })}
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="lap-table-wrapper">
                <Table size="sm" className="lap-comparison-table mb-0">
                  <thead>
                    <tr>
                      <th>Lap</th>
                      <th className="d-none d-md-table-cell">{selectedDriver?.name}</th>
                      <th className="d-none d-md-table-cell">{comparisonDriver?.name}</th>
                      <th>Lap Δ</th>
                      <th>Track Gap</th>
                      <th className="d-none d-md-table-cell">Pos.</th>
                      <th className="lap-expand-col d-none d-md-table-cell" />
                    </tr>
                  </thead>
                  <tbody>
                    {gapData.map((lap) => {
                      const isExpanded = expandedLaps.has(lap.lap);
                      return (
                        <React.Fragment key={lap.lap}>
                          <tr className={`lap-table-row${isExpanded ? ' expanded' : ''}`} onClick={() => toggleLapExpand(lap.lap)}>
                            <td>{lap.lap}</td>
                            <td className="d-none d-md-table-cell">{msToTime(Math.round(lap.primaryTime * 1000))}{getPitIndicator(lap.lap, true)}</td>
                            <td className="d-none d-md-table-cell">{msToTime(Math.round(lap.comparisonTime * 1000))}{getPitIndicator(lap.lap, false)}</td>
                            <td className={lap.timeGap > 0 ? 'text-danger' : 'text-success'}>{formatTimeGap(lap.timeGap)}</td>
                            <td className={lap.cumulativeGap > 0 ? 'text-danger' : 'text-success'}>{formatTimeGap(lap.cumulativeGap)}</td>
                            <td className="text-muted small d-none d-md-table-cell">P{lap.primaryPos} / P{lap.comparisonPos}</td>
                            <td className="lap-expand-col d-none d-md-table-cell">
                              <span className="lap-expand-chevron">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
                                  <path fill="none" stroke="#00a8e1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 5l6 6 6-6"/>
                                </svg>
                              </span>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="sector-expand-row">
                              <td colSpan={7}>
                                <div className="sector-expand-inner">
                                  {[1, 2, 3].map(s => {
                                    const pTime = lap[`primaryS${s}`];
                                    const cTime = lap[`comparisonS${s}`];
                                    const pWins = pTime != null && cTime != null && pTime < cTime;
                                    const cWins = pTime != null && cTime != null && cTime < pTime;
                                    return (
                                      <div key={s} className="sector-expand-item">
                                        <span className="sector-expand-label">S{s}</span>
                                        <span style={{ color: '#00a8e1', fontWeight: pWins ? 700 : 400 }}>
                                          {pTime != null ? msToTime(Math.round(pTime * 1000)) : '—'}
                                        </span>
                                        <span className="sector-expand-sep">vs</span>
                                        <span style={{ color: '#f7a800', fontWeight: cWins ? 700 : 400 }}>
                                          {cTime != null ? msToTime(Math.round(cTime * 1000)) : '—'}
                                        </span>
                                        {pTime != null && cTime != null && (
                                          <span className="sector-expand-delta" style={{ color: (pTime - cTime) <= 0 ? '#00a8e1' : '#f7a800' }}>
                                            ({formatTimeGap(pTime - cTime)})
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <p className="d-md-none text-muted small text-center py-2 mb-0 px-3">
              <b>Full lap charts and sector analysis available on desktop</b>
            </p>
          </Card>

          <Card className="mb-4 d-none d-md-block">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Sector Time Comparison</h5>
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
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const primaryEntry = payload.find(e => e.name === selectedDriver?.name);
                        const comparisonEntry = payload.find(e => e.name === comparisonDriver?.name);
                        if (!primaryEntry && !comparisonEntry) return null;
                        const delta = primaryEntry?.value != null && comparisonEntry?.value != null
                          ? primaryEntry.value - comparisonEntry.value
                          : null;
                        return (
                          <div className="custom-tooltip card p-2">
                            <p className="mb-1 fw-bold small">Lap {label}</p>
                            {primaryEntry?.value != null && (
                              <p className="mb-0 small" style={{ color: '#00a8e1' }}>{primaryEntry.name}: {msToTime(Math.round(primaryEntry.value * 1000))}</p>
                            )}
                            {comparisonEntry?.value != null && (
                              <p className="mb-0 small" style={{ color: '#f7a800' }}>{comparisonEntry.name}: {msToTime(Math.round(comparisonEntry.value * 1000))}</p>
                            )}
                            {delta != null && (
                              <p className="mb-0 small" style={{ color: delta <= 0 ? '#00a8e1' : '#f7a800' }}>
                                {formatTimeGap(delta)}
                              </p>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Legend content={renderChartLegend} />
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

        </>
      )}
    </div>
  );
};

export default SessionHistoryHeadToHeadComparison;