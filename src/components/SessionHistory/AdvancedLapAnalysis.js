import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, ButtonGroup, Button } from 'react-bootstrap';
import { 
  ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ReferenceLine, Scatter
} from 'recharts';
import msToTime from '../../utils/msToTime';
import './AdvancedLapAnalysis.css';

const AdvancedLapAnalysis = ({ eventsData, race, selectedRacerName }) => {
  const [processedData, setProcessedData] = useState({
    lapEvents: [],
    bestLap: null,
    bestSectors: {},
    lapTimeStats: {},
    lapComparisons: [],
    pitLaps: []
  });
  const [analysisMode, setAnalysisMode] = useState('clean'); // 'clean', 'all'
  const [dataInsights, setDataInsights] = useState([]);

  // Process event data when it changes
  useEffect(() => {
    if (eventsData && eventsData.length > 0) {
      processEventData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventsData, analysisMode]);

  const processEventData = () => {
      // Get lap events and sort chronologically
      const lapEvents = eventsData
      .filter(event => event.event_name === "Lap")
      .sort((a, b) => a.attributes_Lap - b.attributes_Lap);
      
      // console.log('lapEvents:',lapEvents)
    if (lapEvents.length === 0) return;

    // Find best lap time
    const bestLap = lapEvents.reduce(
      (best, current) => current.attributes_LapTime < best.attributes_LapTime ? current : best, 
      lapEvents[0]
    );

    // Find best sector times
    const bestSectors = {
      sector1: Math.min(...lapEvents.map(lap => lap.attributes_Sector1Time)),
      sector2: Math.min(...lapEvents.map(lap => lap.attributes_Sector2Time)),
      sector3: Math.min(...lapEvents.map(lap => lap.attributes_Sector3Time)),
    };

    // Calculate overall stats
    let validLaps = lapEvents;
    if (analysisMode === 'clean') {
      // Filter out first lap and potential outliers (very slow laps)
      const medianLapTime = calculateMedianLapTime(lapEvents.slice(1));
      validLaps = lapEvents.filter((lap, i) => 
        i > 0 && lap.attributes_LapTime < medianLapTime * 1.2
      );
    }

    const lapTimeStats = calculateLapTimeStats(validLaps);

    // Detect pit stops
    const pitLaps = detectPitStops(eventsData, lapEvents);

    // Generate lap comparisons between consecutive laps
    const lapComparisons = lapEvents.map((lap, index) => {
      if (index === 0) return null;
      
      const prevLap = lapEvents[index - 1];
      const totalDelta = lap.attributes_LapTime - prevLap.attributes_LapTime;
      
      return {
        currentLap: lap.attributes_Lap,
        prevLap: prevLap.attributes_Lap,
        totalDelta,
        sector1Delta: lap.attributes_Sector1Time - prevLap.attributes_Sector1Time,
        sector2Delta: lap.attributes_Sector2Time - prevLap.attributes_Sector2Time,
        sector3Delta: lap.attributes_Sector3Time - prevLap.attributes_Sector3Time,
        isPitLap: pitLaps.includes(lap.attributes_Lap)
      };
    }).filter(Boolean);

    setProcessedData({
      lapEvents,
      bestLap,
      bestSectors,
      lapTimeStats,
      lapComparisons,
      pitLaps
    });
    
    generateLapInsights(lapEvents, bestSectors, lapTimeStats, pitLaps);
  };

  // Calculate median lap time (more robust than mean for outlier detection)
  const calculateMedianLapTime = (laps) => {
    if (laps.length === 0) return 0;
    
    const lapTimes = laps.map(lap => lap.attributes_LapTime).sort((a, b) => a - b);
    const mid = Math.floor(lapTimes.length / 2);
    
    return lapTimes.length % 2 === 0
      ? (lapTimes[mid - 1] + lapTimes[mid]) / 2
      : lapTimes[mid];
  };

  // Calculate various statistics about lap times
  const calculateLapTimeStats = (laps) => {
    if (laps.length === 0) return {};
    const medianLapTime = calculateMedianLapTime(laps);
    
    const lapTimes = laps.filter((lap) => lap.attributes_LapTime < medianLapTime + 30000).map(lap => lap.attributes_LapTime);
    const avgLapTime = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
    
    // Calculate standard deviation for consistency
    const squaredDiffs = lapTimes.map(time => Math.pow(time - avgLapTime, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length;
    const stdDev = Math.sqrt(avgSquaredDiff);
    
    // Calculate coefficient of variation (normalized standard deviation)
    const cv = stdDev / avgLapTime;
    
    return {
      min: Math.min(...lapTimes),
      max: Math.max(...lapTimes),
      avg: avgLapTime,
      median: calculateMedianLapTime(laps),
      stdDev,
      cv,
      range: Math.max(...lapTimes) - Math.min(...lapTimes),
      consistency: (10 - Math.min(10, cv * 2000)).toFixed(1) // Convert CV to a 0-10 scale
    };
  };

  // Detect pit stops by analyzing lap time anomalies
  const detectPitStops = (events, laps) => {
    const pitLaps = [];
    const medianLapTime = calculateMedianLapTime(laps);
    
    for (let i = 1; i < laps.length; i++) {
      const currentLap = laps[i];
      if (currentLap.attributes_LapTime > medianLapTime + 30000) { // 30 seconds threshold
        pitLaps.push(currentLap.attributes_Lap);
      }
    }
    
    return pitLaps;
  };

  // Generate insights based on lap data
  const generateLapInsights = (lapEvents, bestSectors, lapTimeStats, pitLaps) => {
    const insights = [];
    
    // Consistency insight
    const consistencyScore = parseFloat(lapTimeStats.consistency || 0);
    if (consistencyScore >= 8) {
      insights.push({
        type: 'positive',
        title: 'Excellent Consistency',
        description: 'Very consistent lap times throughout the race.',
        icon: 'bi-graph-up'
      });
    } else if (consistencyScore <= 5) {
      insights.push({
        type: 'negative',
        title: 'Inconsistent Performance',
        description: 'Lap times varied significantly. Focus on consistency.',
        icon: 'bi-lightning'
      });
    }
    
    // Check for improvement over race
    const cleanLaps = lapEvents.filter(
      lap => !pitLaps.includes(lap.attributes_Lap)
    );
    if (cleanLaps.length >= 6) {
      const firstThird = cleanLaps.slice(0, Math.floor(cleanLaps.length / 3));
      const lastThird = cleanLaps.slice(-Math.floor(cleanLaps.length / 3));
      
      const firstAvg = firstThird.reduce((sum, lap) => sum + lap.attributes_LapTime, 0) / firstThird.length;
      const lastAvg = lastThird.reduce((sum, lap) => sum + lap.attributes_LapTime, 0) / lastThird.length;
      
      if (lastAvg < firstAvg) {
        const improvementPercent = ((firstAvg - lastAvg) / firstAvg * 100).toFixed(1);
        insights.push({
          type: 'positive',
          title: 'Race Pace Improvement',
          description: `Pace improved by ${improvementPercent}% from start to end.`,
          icon: 'bi-stopwatch'
        });
      }
    }
    
    // Calculate ideal lap time
    const idealLapTime = bestSectors.sector1 + bestSectors.sector2 + bestSectors.sector3;
    const improvementPotential = ((processedData.bestLap?.attributes_LapTime - idealLapTime) / 
                                  processedData.bestLap?.attributes_LapTime * 100).toFixed(1);
    
    if (improvementPotential > 0.5) {
      insights.push({
        type: 'opportunity',
        title: 'Untapped Potential',
        description: `Potential ${improvementPotential}% improvement by combining best sectors.`,
        icon: 'bi-stars'
      });
    }
    
    setDataInsights(insights);
  };

  // Format data for charts
  const formatLapDataForChart = () => {
    return processedData.lapEvents.map(lap => {
      const isPit = processedData.pitLaps.includes(lap.attributes_Lap);
      const isBest = lap.attributes_LapTime === processedData.bestLap?.attributes_LapTime;
      
      return {
        lap: lap.attributes_Lap,
        lapTime: lap.attributes_LapTime / 1000, // Convert to seconds
        s1: lap.attributes_Sector1Time / 1000,
        s2: lap.attributes_Sector2Time / 1000,
        s3: lap.attributes_Sector3Time / 1000,
        position: lap.attributes_RacePosition,
        isPit,
        isBest,
        pitStop: isPit ? lap.attributes_LapTime / 1000 : null,
        bestLap: isBest ? lap.attributes_LapTime / 1000 : null,
      };
    });
  };

  // Custom tooltip for lap chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload.find(p => p.name === 'Lap Time')?.payload;
      if (!data) return null;
      
      return (
        <div className="custom-tooltip">
          <div className="tooltip-header">Lap {label}</div>
          <div className="tooltip-item">
            <span className="tooltip-label">Lap Time:</span>
            <span className="tooltip-value">{msToTime(data.lapTime * 1000)}</span>
          </div>
          <div className="tooltip-item">
            <span className="tooltip-label">S1:</span>
            <span className="tooltip-value">{msToTime(data.s1 * 1000)}</span>
          </div>
          <div className="tooltip-item">
            <span className="tooltip-label">S2:</span>
            <span className="tooltip-value">{msToTime(data.s2 * 1000)}</span>
          </div>
          <div className="tooltip-item">
            <span className="tooltip-label">S3:</span>
            <span className="tooltip-value">{msToTime(data.s3 * 1000)}</span>
          </div>
          <div className="tooltip-item">
            <span className="tooltip-label">Position:</span>
            <span className="tooltip-value">P{data.position}</span>
          </div>
          {data.isPit && (
            <div className="tooltip-pit-indicator">Pit Stop Lap</div>
          )}
          {data.isBest && (
            <div className="tooltip-best-indicator">Best Lap</div>
          )}
        </div>
      );
    }
    return null;
  };

  // Generate delta colors based on time difference
  // const getDeltaColor = (delta) => {
  //   if (delta === 0) return 'text-muted';
  //   return delta < 0 ? 'text-success' : 'text-danger';
  // };

  // // Format delta time with sign
  // const formatDelta = (delta) => {
  //   const prefix = delta < 0 ? '-' : '+';
  //   return `${prefix}${msToTime(Math.abs(delta))}`;
  // };

  // Calculate ideal lap
  const calculateIdealLap = () => {
    if (!processedData.bestSectors) return { sectors: {}, total: 0 };
    
    return {
      sectors: {
        s1: processedData.bestSectors.sector1,
        s2: processedData.bestSectors.sector2,
        s3: processedData.bestSectors.sector3
      },
      total: processedData.bestSectors.sector1 + 
             processedData.bestSectors.sector2 + 
             processedData.bestSectors.sector3
    };
  };

  const idealLap = calculateIdealLap();
  
  return (
    <Container fluid className="advanced-lap-analysis p-0">
      {/* Controls and Insights */}
      <Row className="mb-3">
        <Col md={8}>
          <Card className="analysis-controls mb-3">
            <Card.Body className="d-flex flex-wrap justify-content-between align-items-center py-2">
              <div className="mb-2 mb-md-0">
                <h6 className="mb-0">Advanced Lap Analysis</h6>
                <small className="text-muted">
                  {processedData.lapEvents.length} laps analyzed for {selectedRacerName}
                </small>
              </div>
              <div className="d-flex align-items-center">
                <div className="mode-selector">
                  <ButtonGroup size="sm">
                    <Button
                      variant={analysisMode === 'clean' ? 'primary' : 'outline-primary'}
                      onClick={() => setAnalysisMode('clean')}
                    >
                      Clean Laps
                    </Button>
                    <Button
                      variant={analysisMode === 'all' ? 'primary' : 'outline-primary'}
                      onClick={() => setAnalysisMode('all')}
                    >
                      All Laps
                    </Button>
                  </ButtonGroup>
                </div>
              </div>
            </Card.Body>
          </Card>
          
          {/* Lap Time Chart */}
          <Card className="mb-3">
            <Card.Body>
              <h6 className="mb-3">Lap Time Progression</h6>
              <div style={{ height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={formatLapDataForChart()}
                    margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="lap" 
                      label={{ value: 'Lap Number', position: 'insideBottomRight', offset: -10 }}
                    />
                    <YAxis 
                      label={{ value: 'Time (seconds)', angle: -90, position: 'insideLeft' }}
                      domain={['dataMin - 0.5', 'dataMax + 0.5']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    
                    {/* Pit stop reference lines */}
                    {processedData.pitLaps.map(lapNum => (
                      <ReferenceLine
                        key={`pit-${lapNum}`}
                        x={lapNum}
                        stroke="#dc3545"
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        label={{ value: 'Pit', position: 'top', fill: '#dc3545', fontSize: 10 }}
                      />
                    ))}
                    
                    <Line
                      type="monotone"
                      dataKey="lapTime"
                      name="Lap Time"
                      stroke="#8884d8"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                    
                    <Line
                      type="monotone"
                      dataKey="s1"
                      name="Sector 1"
                      stroke="#82ca9d"
                      strokeWidth={1}
                      dot={{ r: 2 }}
                    />
                    
                    <Line
                      type="monotone"
                      dataKey="s2"
                      name="Sector 2"
                      stroke="#ffc658"
                      strokeWidth={1}
                      dot={{ r: 2 }}
                    />
                    
                    <Line
                      type="monotone"
                      dataKey="s3"
                      name="Sector 3"
                      stroke="#ff8042"
                      strokeWidth={1}
                      dot={{ r: 2 }}
                    />
                    
                    <Scatter
                      name="Pit Stop"
                      dataKey="pitStop"
                      fill="#dc3545"
                      shape="triangle"
                    />
                    
                    <Scatter
                      name="Best Lap"
                      dataKey="bestLap"
                      fill="#28a745"
                      shape="star"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
          
          {/* Consistency Analysis */}
          <Card className="mb-3">
            <Card.Body>
              <h6>Lap Time Consistency</h6>
              <Row className="mt-3">
                <Col md={6}>
                  <div className="consistency-meter mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Overall Consistency</span>
                      <span className="consistency-score">
                        {processedData.lapTimeStats.consistency}/10
                      </span>
                    </div>
                    <div className="progress" style={{ height: '12px' }}>
                      <div 
                        className="progress-bar" 
                        role="progressbar"
                        style={{
                          width: `${processedData.lapTimeStats.consistency * 10}%`,
                          backgroundColor: getConsistencyColor(processedData.lapTimeStats.consistency)
                        }}
                        aria-valuenow={processedData.lapTimeStats.consistency * 10}
                        aria-valuemin="0" 
                        aria-valuemax="100"
                      ></div>
                    </div>
                  </div>
                  
                  <div className="lap-time-stats">
                    <div className="stat-row">
                      <span>Best Lap</span>
                      <span>{msToTime(processedData.lapTimeStats.min || 0)}</span>
                    </div>
                    <div className="stat-row">
                      <span>Median Lap</span>
                      <span>{msToTime(processedData.lapTimeStats.median || 0)}</span>
                    </div>
                    <div className="stat-row">
                      <span>Average Lap</span>
                      <span>{msToTime(processedData.lapTimeStats.avg || 0)}</span>
                    </div>
                    <div className="stat-row">
                      <span>Worst Lap</span>
                      <span>{msToTime(processedData.lapTimeStats.max || 0)}</span>
                    </div>
                    <div className="stat-row">
                      <span>Range</span>
                      <span>{msToTime(processedData.lapTimeStats.range || 0)}</span>
                    </div>
                  </div>
                </Col>
                
                <Col md={6}>
                  <div className="sector-consistency mb-3">
                    <h6 className="mb-2">Sector Analysis</h6>
                    <div className="sector-box">
                      <div className="sector-title">
                        <span>Sector 1</span>
                        <span>{msToTime(processedData.bestSectors.sector1 || 0)}</span>
                      </div>
                      <div className="sector-title">
                        <span>Sector 2</span>
                        <span>{msToTime(processedData.bestSectors.sector2 || 0)}</span>
                      </div>
                      <div className="sector-title">
                        <span>Sector 3</span>
                        <span>{msToTime(processedData.bestSectors.sector3 || 0)}</span>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          {/* Insights Card */}
          <Card className="mb-3">
            <Card.Header className="py-2">
              <h6 className="mb-0">
                <i className="bi bi-lightbulb-fill text-warning me-2"></i>
                Performance Insights
              </h6>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="insights-list">
                {dataInsights.length > 0 ? (
                  dataInsights.map((insight, index) => (
                    <div key={index} className={`insight-card ${insight.type}`}>
                      <div className="insight-icon">
                        <i className={`bi ${insight.icon}`}></i>
                      </div>
                      <div className="insight-content">
                        <div className="insight-title">{insight.title}</div>
                        <div className="insight-description">{insight.description}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-muted">
                    No insights available
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
          
          {/* Ideal Lap Calculator */}
          <Card>
            <Card.Header className="py-2">
              <h6 className="mb-0">
                <i className="bi bi-trophy-fill text-success me-2"></i>
                Ideal Lap Calculator
              </h6>
            </Card.Header>
            <Card.Body>
              <div className="ideal-lap-container">
                <div className="sector-times mb-3">
                  <div className="sector-row">
                    <span>Best S1</span>
                    <span>{msToTime(idealLap.sectors.s1)}</span>
                  </div>
                  <div className="sector-row">
                    <span>Best S2</span>
                    <span>{msToTime(idealLap.sectors.s2)}</span>
                  </div>
                  <div className="sector-row">
                    <span>Best S3</span>
                    <span>{msToTime(idealLap.sectors.s3)}</span>
                  </div>
                  <div className="sector-row total">
                    <span>Ideal Lap</span>
                    <span>{msToTime(idealLap.total)}</span>
                  </div>
                </div>
                
                <div className="ideal-lap-comparison">
                  <div className="comparison-row">
                    <span>Your Best Lap</span>
                    <span>{msToTime(processedData.bestLap?.attributes_LapTime || 0)}</span>
                  </div>
                  <div className="comparison-row improvement">
                    <span>Potential Improvement</span>
                    <span className="text-success">
                      {msToTime(Math.max(0, 
                        (processedData.bestLap?.attributes_LapTime || 0) - idealLap.total))}
                    </span>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

// Helper function for consistency color
function getConsistencyColor(score) {
  score = parseFloat(score);
  if (score >= 8) return '#28a745'; // green
  if (score >= 6) return '#17a2b8'; // blue
  if (score >= 4) return '#ffc107'; // yellow
  return '#dc3545'; // red
}

export default AdvancedLapAnalysis;