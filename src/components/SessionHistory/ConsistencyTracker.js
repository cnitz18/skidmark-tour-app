import React, { useEffect, useState } from 'react';
import { Card, Row, Col, ProgressBar } from 'react-bootstrap';
import msToTime from '../../utils/msToTime';
import { useRaceAnalytics } from '../../utils/RaceAnalyticsContext';
import './ConsistencyTracker.css';

const ConsistencyTracker = ({ eventsData, selectedParticipantId }) => {
  const [analyticsData,setAnalyticsData] = useState();
  const { driverAnalytics } = useRaceAnalytics();
  
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
                  <span className="fw-bold">{msToTime(analyticsData?.stdDev)}s</span>
                </div>
                <div className="detail-row d-flex justify-content-between mb-2">
                  <span>Lap Time Spread:</span>
                  <span className="fw-bold">{msToTime(analyticsData?.spread)}s <small className="text-muted">(fastest to slowest)</small></span>
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
                      <span className="arrow-icon text-success me-2">↑</span>
                      <span>Improving lap times</span>
                    </div>
                  )}
                  {improvementTrend.trend === 'steady' && (
                    <div className="d-flex align-items-center text-primary mb-2">
                      <span className="arrow-icon text-primary me-2">→</span>
                      <span>Consistent lap times</span>
                    </div>
                  )}
                  {improvementTrend.trend === 'declining' && (
                    <div className="d-flex align-items-center text-warning mb-2">
                      <span className="arrow-icon text-warning me-2">↓</span>
                      <span>Declining lap times</span>
                    </div>
                  )}
                  {improvementTrend.trend === 'mixed' && (
                    <div className="d-flex align-items-center text-secondary mb-2">
                      <span className="arrow-icon text-secondary me-2">↔</span>
                      <span>Mixed lap times</span>
                    </div>
                  )}
                  
                  <div className="trend-details text-muted">
                    <small>{improvementTrend.message}</small>
                  </div>
                </div>
              </div>
              
              <div className="race-phases">
                <h6>Race Phases (avg.)</h6>
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
                  <div className={`sector-card p-3 rounded ${analyticsData?.hasSessionBestS1 ? 'sector-card-best' : ''}`}>
                    <h6 className="sector-title">
                      <span className="sector-badge">S1</span> Sector 1
                      {analyticsData?.hasSessionBestS1 && 
                        <span className="ms-2 badge bg-purple">SESSION BEST</span>}
                    </h6>
                    <div className="sector-stats">
                      <div className="stat-row d-flex justify-content-between mb-2">
                        <span>My Best:</span>
                        <span className="fw-bold">{msToTime(analyticsData?.bestSector1Time)}</span>
                      </div>
                      <div className="stat-row d-flex justify-content-between mb-2">
                        <span>Gap to Session Best:</span>
                        {analyticsData?.gapToSessionBestS1 === 0 ? (
                          <span className="fw-bold text-purple">BEST</span>
                        ) : (
                          <span className="fw-bold text-danger">
                            +{msToTime(analyticsData?.gapToSessionBestS1)}
                          </span>
                        )}
                      </div>
                      <div className="stat-row d-flex justify-content-between mb-2">
                        <span>Consistency:</span>
                        <span className="fw-bold">{analyticsData?.consistencyS1}/10</span>
                      </div>
                    </div>
                  </div>
                </Col>
                
                <Col md={4} className="mb-3 mb-md-0">
                  <div className={`sector-card p-3 rounded ${analyticsData?.hasSessionBestS2 ? 'sector-card-best' : ''}`}>
                    <h6 className="sector-title">
                      <span className="sector-badge">S2</span> Sector 2
                      {analyticsData?.hasSessionBestS2 && 
                        <span className="ms-2 badge bg-purple">SESSION BEST</span>}
                    </h6>
                    <div className="sector-stats">
                      <div className="stat-row d-flex justify-content-between mb-2">
                        <span>My Best:</span>
                        <span className="fw-bold">{msToTime(analyticsData?.bestSector2Time)}</span>
                      </div>
                      <div className="stat-row d-flex justify-content-between mb-2">
                        <span>Gap to Session Best:</span>
                        {analyticsData?.gapToSessionBestS2 === 0 ? (
                          <span className="fw-bold text-purple">BEST</span>
                        ) : (
                          <span className="fw-bold text-danger">
                            +{msToTime(analyticsData?.gapToSessionBestS2)}
                          </span>
                        )}
                      </div>
                      <div className="stat-row d-flex justify-content-between mb-2">
                        <span>Consistency:</span>
                        <span className="fw-bold">{analyticsData?.consistencyS2}/10</span>
                      </div>
                    </div>
                  </div>
                </Col>
                
                <Col md={4}>
                  <div className={`sector-card p-3 rounded ${analyticsData?.hasSessionBestS3 ? 'sector-card-best' : ''}`}>
                    <h6 className="sector-title">
                      <span className="sector-badge">S3</span> Sector 3
                      {analyticsData?.hasSessionBestS3 && 
                        <span className="ms-2 badge bg-purple">SESSION BEST</span>}
                    </h6>
                    <div className="sector-stats">
                      <div className="stat-row d-flex justify-content-between mb-2">
                        <span>My Best:</span>
                        <span className="fw-bold">{msToTime(analyticsData?.bestSector3Time)}</span>
                      </div>
                      <div className="stat-row d-flex justify-content-between mb-2">
                        <span>Gap to Session Best:</span>
                        {analyticsData?.gapToSessionBestS3 === 0 ? (
                          <span className="fw-bold text-purple">BEST</span>
                        ) : (
                          <span className="fw-bold text-danger">
                            +{msToTime(analyticsData?.gapToSessionBestS3)}
                          </span>
                        )}
                      </div>
                      <div className="stat-row d-flex justify-content-between mb-2">
                        <span>Consistency:</span>
                        <span className="fw-bold">{analyticsData?.consistencyS3}/10</span>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
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

export default ConsistencyTracker;