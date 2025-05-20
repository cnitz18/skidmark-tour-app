import React, { useEffect, useState } from 'react';
import { Card, Row, Col, ProgressBar } from 'react-bootstrap';
import msToTime from '../../utils/msToTime';
import { useRaceAnalytics } from '../../utils/RaceAnalyticsContext';
import './ConsistencyTracker.css';

const ConsistencyTracker = ({ eventsData, selectedParticipantId }) => {
  const [analyticsData,setAnalyticsData] = useState();
  const { driverAnalytics } = useRaceAnalytics();

  useEffect(() => {
    console.log("Analytics Data: ", analyticsData);
  },[analyticsData]);
  
  useEffect(() => {
    const driverData = driverAnalytics[selectedParticipantId];
    if( driverData ){
      setAnalyticsData(driverData);
    }
  },[driverAnalytics,selectedParticipantId])
  
  // Get only lap events
  const lapEvents = eventsData.filter(evt => evt.event_name === "Lap");
  
  // Skip first lap as it's usually outlier (formation lap or incomplete)
  const raceLaps = lapEvents.length > 1 ? lapEvents.slice(1) : lapEvents;
    
  // Get improvement trend (are lap times improving over the race?)
  const improvementTrend = calculateImprovementTrend(raceLaps);
  
  // Identify strongest and weakest sectors
  const sectorAnalysis = analyzeSectors(raceLaps);
  
  return (
    <div className="consistency-tracker">
      <Row className="mb-4">
        <Col md={6}>
          <Card className="h-100 consistency-card">
            <Card.Body>
              <h5 className="mb-3">Lap Time Consistency</h5>
              
              <div className="consistency-rating mb-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="rating-label">Consistency Score</span>
                  <span className="rating-value">{analyticsData?.consistency}/10</span>
                </div>
                <ProgressBar 
                  now={parseFloat(analyticsData?.consistency) * 10} 
                  variant={getVariantForScore(parseInt(analyticsData?.consistency))}
                  style={{ height: "10px" }}
                  className="mb-1"
                />
                <small className="text-muted">
                  {getConsistencyMessage(analyticsData?.consistency)}
                </small>
              </div>
              
              <div className="consistency-details">
                <div className="detail-row d-flex justify-content-between mb-2">
                  <span>Standard Deviation:</span>
                  <span className="fw-bold">{msToTime(analyticsData?.stdDev)}</span>
                </div>
                <div className="detail-row d-flex justify-content-between mb-2">
                  <span>Lap Time Spread:</span>
                  <span className="fw-bold">{msToTime(analyticsData?.spread)} <small className="text-muted">(fastest to slowest)</small></span>
                </div>
                <div className="detail-row d-flex justify-content-between">
                  <span>Consistency vs Field Avg:</span>
                  <span className={`fw-bold ${analyticsData?.fieldComparison >= 0 ? 'text-success' : 'text-danger'}`}>
                    {analyticsData?.fieldComparison > 0 ? '+' : ''}{analyticsData?.fieldComparison.toFixed(1)}%
                  </span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="h-100 improvement-card">
            <Card.Body>
              <h5 className="mb-3">Race Progression</h5>
              
              <div className="race-phases mb-4">
                <h6>Lap Time Trend</h6>
                <div className="phase-indicator">
                  {improvementTrend.trend === 'improving' && (
                    <div className="d-flex align-items-center text-success mb-2">
                      <i className="bi bi-arrow-down me-2"></i>
                      <span>Improving lap times</span>
                    </div>
                  )}
                  {improvementTrend.trend === 'steady' && (
                    <div className="d-flex align-items-center text-primary mb-2">
                      <i className="bi bi-arrow-right me-2"></i>
                      <span>Consistent lap times</span>
                    </div>
                  )}
                  {improvementTrend.trend === 'declining' && (
                    <div className="d-flex align-items-center text-warning mb-2">
                      <i className="bi bi-arrow-up me-2"></i>
                      <span>Declining lap times</span>
                    </div>
                  )}
                  {improvementTrend.trend === 'mixed' && (
                    <div className="d-flex align-items-center text-secondary mb-2">
                      <i className="bi bi-shuffle me-2"></i>
                      <span>Mixed lap times</span>
                    </div>
                  )}
                  
                  <div className="trend-details text-muted">
                    <small>{improvementTrend.message}</small>
                  </div>
                </div>
              </div>
              
              <div className="race-phases">
                <h6>Race Phases</h6>
                <div className="phase-breakdown">
                  <div className="phase d-flex justify-content-between mb-2">
                    <span>First Third:</span>
                    <span className="fw-bold">{msToTime(improvementTrend.firstThirdAvg)}</span>
                  </div>
                  <div className="phase d-flex justify-content-between mb-2">
                    <span>Middle Third:</span>
                    <span className="fw-bold">{msToTime(improvementTrend.middleThirdAvg)}</span>
                  </div>
                  <div className="phase d-flex justify-content-between">
                    <span>Last Third:</span>
                    <span className="fw-bold">{msToTime(improvementTrend.lastThirdAvg)}</span>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <Card className="sector-analysis-card">
            <Card.Body>
              <h5 className="mb-3">Sector Performance Analysis</h5>
              
              <Row>
                <Col md={4} className="mb-3 mb-md-0">
                  <div className="sector-card p-3 rounded">
                    <h6 className="sector-title">
                      <span className="sector-badge">S1</span> Sector 1
                    </h6>
                    <div className="sector-stats">
                      <div className="stat-row d-flex justify-content-between mb-2">
                        <span>Consistency:</span>
                        <span className="fw-bold">{analyticsData?.consistencyS1}/10</span>
                      </div>
                      <div className="stat-row d-flex justify-content-between">
                        <span>vs. Race Avg:</span>
                        <span className={sectorAnalysis.sector1.vsRaceAvg > 0 ? 'text-success' : 'text-danger'}>
                          {sectorAnalysis.sector1.vsRaceAvg > 0 ? '+' : ''}{sectorAnalysis.sector1.vsRaceAvg.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="sector-insight mt-2">
                      <small className="text-muted">{sectorAnalysis.sector1.insight}</small>
                    </div>
                  </div>
                </Col>
                
                <Col md={4} className="mb-3 mb-md-0">
                  <div className="sector-card p-3 rounded">
                    <h6 className="sector-title">
                      <span className="sector-badge">S2</span> Sector 2
                    </h6>
                    <div className="sector-stats">
                      <div className="stat-row d-flex justify-content-between mb-2">
                        <span>Consistency:</span>
                        <span className="fw-bold">{analyticsData?.consistencyS2}/10</span>
                      </div>
                      <div className="stat-row d-flex justify-content-between">
                        <span>vs. Race Avg:</span>
                        <span className={sectorAnalysis.sector2.vsRaceAvg > 0 ? 'text-success' : 'text-danger'}>
                          {sectorAnalysis.sector2.vsRaceAvg > 0 ? '+' : ''}{sectorAnalysis.sector2.vsRaceAvg.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="sector-insight mt-2">
                      <small className="text-muted">{sectorAnalysis.sector2.insight}</small>
                    </div>
                  </div>
                </Col>
                
                <Col md={4}>
                  <div className="sector-card p-3 rounded">
                    <h6 className="sector-title">
                      <span className="sector-badge">S3</span> Sector 3
                    </h6>
                    <div className="sector-stats">
                      <div className="stat-row d-flex justify-content-between mb-2">
                        <span>Consistency:</span>
                        <span className="fw-bold">{analyticsData?.consistencyS3}/10</span>
                      </div>
                      <div className="stat-row d-flex justify-content-between">
                        <span>vs. Race Avg:</span>
                        <span className={sectorAnalysis.sector3.vsRaceAvg > 0 ? 'text-success' : 'text-danger'}>
                          {sectorAnalysis.sector3.vsRaceAvg > 0 ? '+' : ''}{sectorAnalysis.sector3.vsRaceAvg.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="sector-insight mt-2">
                      <small className="text-muted">{sectorAnalysis.sector3.insight}</small>
                    </div>
                  </div>
                </Col>
              </Row>
              
              <div className="focus-area mt-4 p-3 rounded bg-light">
                <h6>Performance Focus Area</h6>
                <p className="mb-0">
                  <strong>{sectorAnalysis.focusArea.title}</strong>: {sectorAnalysis.focusArea.description}
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// Calculate if lap times are improving, steady, or declining
const calculateImprovementTrend = (laps) => {
  if (laps.length < 3) {
    return {
      trend: 'insufficient data',
      message: 'Not enough laps to analyze trend.',
      firstThirdAvg: 0,
      middleThirdAvg: 0,
      lastThirdAvg: 0
    };
  }
  
  const lapTimes = laps.map(lap => lap.attributes_LapTime);
  
  // Split race into thirds
  const third = Math.max(1, Math.floor(lapTimes.length / 3));
  
  const firstThird = lapTimes.slice(0, third);
  const middleThird = lapTimes.slice(third, third * 2);
  const lastThird = lapTimes.slice(third * 2);
  
  const firstThirdAvg = firstThird.reduce((sum, time) => sum + time, 0) / firstThird.length;
  const middleThirdAvg = middleThird.reduce((sum, time) => sum + time, 0) / middleThird.length;
  const lastThirdAvg = lastThird.reduce((sum, time) => sum + time, 0) / lastThird.length;
  
  // Calculate the trend
  let trend, message;
  
  const firstToLastDiff = firstThirdAvg - lastThirdAvg;
  const middleToLastDiff = middleThirdAvg - lastThirdAvg;
  
  if (firstToLastDiff > 0 && middleToLastDiff > 0) {
    trend = 'improving';
    message = `You improved throughout the race, with your final laps ${msToTime(firstToLastDiff)} faster than your early laps.`;
  } else if (firstToLastDiff < 0 && middleToLastDiff < 0) {
    trend = 'declining';
    message = `Your pace declined by ${msToTime(Math.abs(firstToLastDiff))} from start to finish.`;
  } else if (Math.abs(firstToLastDiff) < firstThirdAvg * 0.01) { // Less than 1% change
    trend = 'steady';
    message = 'You maintained very consistent lap times throughout the race.';
  } else {
    trend = 'mixed';
    message = 'Your pace varied throughout the race with no clear trend.';
  }
  
  return {
    trend,
    message,
    firstThirdAvg,
    middleThirdAvg,
    lastThirdAvg
  };
};

// Analyze sector performance
const analyzeSectors = (laps) => {
  if (laps.length <= 1) {
    const defaultSector = {
      consistencyScore: 5.0,
      vsRaceAvg: 0,
      insight: 'Insufficient data for sector analysis.'
    };
    
    return {
      sector1: defaultSector,
      sector2: defaultSector,
      sector3: defaultSector,
      focusArea: {
        title: 'Collect more data',
        description: 'Complete more laps to get personalized insights.'
      }
    };
  }
  
  // Extract sector times
  const sector1Times = laps.map(lap => lap.attributes_Sector1Time);
  const sector2Times = laps.map(lap => lap.attributes_Sector2Time);
  const sector3Times = laps.map(lap => lap.attributes_Sector3Time);
  
  // Calculate consistency scores for each sector
  const sector1Stats = calculateSectorStats(sector1Times);
  const sector2Stats = calculateSectorStats(sector2Times);
  const sector3Stats = calculateSectorStats(sector3Times);
  
  // Find the least consistent sector (lowest score = least consistent)
  const sectors = [
    { name: 'sector1', stats: sector1Stats, number: 1 },
    { name: 'sector2', stats: sector2Stats, number: 2 },
    { name: 'sector3', stats: sector3Stats, number: 3 }
  ];
  
  sectors.sort((a, b) => a.stats.consistencyScore - b.stats.consistencyScore);
  const weakestSector = sectors[0];
  
  // Generate focus area insight
  const focusArea = {
    title: `Improve Sector ${weakestSector.number} Consistency`,
    description: generateSectorInsight(weakestSector.number, weakestSector.stats.consistencyScore)
  };
  
  return {
    sector1: {
      ...sector1Stats,
      insight: sector1Stats.consistencyScore > 7 
        ? 'Strong sector performance.' 
        : 'Consider focusing on consistency here.'
    },
    sector2: {
      ...sector2Stats,
      insight: sector2Stats.consistencyScore > 7
        ? 'Good middle sector times.'
        : 'Work on more consistent midcorner speeds.'
    },
    sector3: {
      ...sector3Stats, 
      insight: sector3Stats.consistencyScore > 7
        ? 'Solid exit sector performance.'
        : 'Focus on clean exits and acceleration zones.'
    },
    focusArea
  };
};

// Helper function to calculate sector stats
const calculateSectorStats = (sectorTimes) => {
  const avg = sectorTimes.reduce((sum, time) => sum + time, 0) / sectorTimes.length;
  
  // Calculate standard deviation
  const squaredDiffs = sectorTimes.map(time => Math.pow(time - avg, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length;
  const standardDeviation = Math.sqrt(avgSquaredDiff);
  
  // Calculate coefficient of variation
  const cv = standardDeviation / avg;
  
  // Map to consistency score
  let consistencyScore = 10 - (cv * 2000);
  consistencyScore = Math.max(0, Math.min(10, consistencyScore));
  
  // Generate random race comparison
  // In a real implementation, compare to other drivers or personal bests
  const vsRaceAvg = (Math.random() * 10) - 5; // -5% to +5%
  
  return {
    consistencyScore,
    vsRaceAvg
  };
};

// Helper function to determine variant color for consistency score
const getVariantForScore = (score) => {
  if (score >= 8) return 'success';
  if (score >= 6) return 'info';
  if (score >= 4) return 'warning';
  return 'danger';
};

// Helper function to generate consistency message
const getConsistencyMessage = (score) => {
  if (score >= 9) return 'Exceptional consistency! Professional level driving.';
  if (score >= 8) return 'Excellent consistency throughout the session.';
  if (score >= 7) return 'Very good consistency, minor variations in lap times.';
  if (score >= 6) return 'Good consistency with room for improvement.';
  if (score >= 5) return 'Average consistency, focus on more regular lap times.';
  if (score >= 4) return 'Below average consistency, work on eliminating mistakes.';
  if (score >= 3) return 'Inconsistent laps, focus on finding a rhythm.';
  return 'High variability in lap times. Focus on fundamentals.';
};

// Generate sector-specific insights
const generateSectorInsight = (sectorNumber, score) => {
  if (score < 5) {
    switch(sectorNumber) {
      case 1:
        return 'Work on brake markers and turn-in points for more consistent entry speeds.';
      case 2:
        return 'Focus on hitting consistent apexes and maintaining mid-corner speed.';
      case 3:
        return 'Practice track-out positioning and throttle application for cleaner exits.';
      default:
        return 'Work on overall consistency.';
    }
  } else {
    return `Your Sector ${sectorNumber} times show some inconsistency. Small improvements here could yield better overall lap times.`;
  }
};

export default ConsistencyTracker;