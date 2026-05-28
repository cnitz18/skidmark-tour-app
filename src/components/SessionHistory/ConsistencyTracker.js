import React, { useEffect, useState } from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import msToTime from '../../utils/msToTime';
import { useRaceAnalytics } from '../../utils/RaceAnalyticsContext';
import detectPitStops from '../../utils/detectPitStops';
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
  
  const lapEvents = eventsData.filter(evt => evt.event_name === 'Lap');
  const rawLaps = lapEvents.length > 1 ? lapEvents.slice(1) : lapEvents;
  const pitLaps = detectPitStops(eventsData, rawLaps);
  const pitAffectedLaps = new Set([...pitLaps.in, ...pitLaps.out]);
  const validLapTimes = rawLaps
    .map((lap) => lap.attributes_LapTime)
    .filter((lapTime) => lapTime > 0)
    .sort((left, right) => left - right);
  const medianLapTime = getMedian(validLapTimes);
  const cleanLaps = rawLaps.filter((lap) => {
    const lapNumber = lap.attributes_Lap;
    const lapTime = lap.attributes_LapTime;
    return lapTime > 0 && !pitAffectedLaps.has(lapNumber) && lapTime <= medianLapTime * 1.1;
  });
  const stintInsights = buildStintInsights(rawLaps, pitAffectedLaps);
  const paceWindows = buildPaceWindows(cleanLaps);
  const stintSummary = buildStintSummary(stintInsights, cleanLaps.length);
  const sectorInsights = buildSectorInsights(cleanLaps);
  const cleanLapTimes = cleanLaps.map(l => l.attributes_LapTime);
  const cleanBestLap = cleanLapTimes.length ? Math.min(...cleanLapTimes) : null;
  const cleanAvgLap = cleanLapTimes.length ? cleanLapTimes.reduce((s, t) => s + t, 0) / cleanLapTimes.length : null;
  const localPaceSpreadMs = cleanBestLap != null && cleanAvgLap != null ? Math.round(cleanAvgLap - cleanBestLap) : null;
  const fieldAvgPaceSpread = analyticsData?.fieldAvgPaceSpread ?? null;
  const paceSpreadLabel = getPaceSpreadLabel(localPaceSpreadMs, fieldAvgPaceSpread);
  const sectorBestHolders = getSectorBestHolders(driverAnalytics);

  return (
    <div className="consistency-tracker">
      <Card className="mb-4 sector-analysis-card">
        <Card.Header>
          <h5 className="mb-0">Sector Performance Analysis</h5>
        </Card.Header>
        <Card.Body>
              
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
                      {sectorBestHolders.s1 && (
                        <div className="stat-row mb-2">
                          <small className="text-muted">Held by {sectorBestHolders.s1}</small>
                        </div>
                      )}
                      <div className="stat-row d-flex justify-content-between mb-2">
                        <span>Pace Spread:</span>
                        <span className="fw-bold">{sectorInsights.s1.paceSpreadLabel}</span>
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
                      {sectorBestHolders.s2 && (
                        <div className="stat-row mb-2">
                          <small className="text-muted">Held by {sectorBestHolders.s2}</small>
                        </div>
                      )}
                      <div className="stat-row d-flex justify-content-between mb-2">
                        <span>Pace Spread:</span>
                        <span className="fw-bold">{sectorInsights.s2.paceSpreadLabel}</span>
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
                      {sectorBestHolders.s3 && (
                        <div className="stat-row mb-2">
                          <small className="text-muted">Held by {sectorBestHolders.s3}</small>
                        </div>
                      )}
                      <div className="stat-row d-flex justify-content-between mb-2">
                        <span>Pace Spread:</span>
                        <span className="fw-bold">{sectorInsights.s3.paceSpreadLabel}</span>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
        </Card.Body>
      </Card>

      <Row>
        <Col md={6} className="mb-4">
        <Card className="h-100 consistency-card">
          <Card.Header>
            <h5 className="mb-0">Pace Spread</h5>
          </Card.Header>
        <Card.Body>

              <div className="consistency-std-display mb-3">
                <div className="consistency-std-stack mb-1">
                  <span className="consistency-std-value">
                    {localPaceSpreadMs != null ? `+${(localPaceSpreadMs / 1000).toFixed(3)}s` : '—'}
                  </span>
                  <span className={`consistency-std-label-badge consistency-${paceSpreadLabel.key}`}>{paceSpreadLabel.label}</span>
                </div>
                <small className="text-muted">Avg − best clean lap (pit stops &amp; outliers excluded)</small>
                {fieldAvgPaceSpread != null && (
                  <small className="text-muted d-block mt-1">vs. field avg: +{(fieldAvgPaceSpread / 1000).toFixed(3)}s</small>
                )}
              </div>

              <div className="pace-window-grid mb-3">
                <div className="pace-window-card">
                  <div className="pace-window-label">Best 3-Lap Avg</div>
                  <div className="pace-window-value">{paceWindows.bestThreeLapAvg ? msToTime(paceWindows.bestThreeLapAvg) : 'N/A'}</div>
                  <div className="pace-window-detail">{paceWindows.bestThreeLapRange || 'Not enough clean laps'}</div>
                </div>
                <div className="pace-window-card">
                  <div className="pace-window-label">Best 5-Lap Avg</div>
                  <div className="pace-window-value">{paceWindows.bestFiveLapAvg ? msToTime(paceWindows.bestFiveLapAvg) : 'N/A'}</div>
                  <div className="pace-window-detail">{paceWindows.bestFiveLapRange || 'Not enough clean laps'}</div>
                </div>
                <div className="pace-window-card">
                  <div className="pace-window-label">Fastest Lap</div>
                  <div className="pace-window-value">{cleanBestLap ? msToTime(cleanBestLap) : 'N/A'}</div>
                </div>
                <div className="pace-window-card">
                  <div className="pace-window-label">Clean Laps</div>
                  <div className="pace-window-value">{cleanLaps.length}</div>
                  <div className="pace-window-detail">used in analysis</div>
                </div>
              </div>


          </Card.Body>
        </Card>
        </Col>
        <Col md={6} className="mb-4">
        <Card className="h-100 improvement-card">
          <Card.Header>
            <h5 className="mb-0">Stint Pace</h5>
          </Card.Header>
        <Card.Body>
              <div className="stint-summary-grid mb-3">
                <div className="stint-summary-card">
                  <div className="stint-summary-label">Best Opening Lap</div>
                  <div className="stint-summary-value">{stintSummary.bestOpeningLap ? msToTime(stintSummary.bestOpeningLap.time) : 'N/A'}</div>
                  <div className="pace-window-detail">{stintSummary.bestOpeningLap?.label || 'No clean stints'}</div>
                </div>
                <div className="stint-summary-card">
                  <div className="stint-summary-label">Best Closing Lap</div>
                  <div className="stint-summary-value">{stintSummary.bestClosingLap ? msToTime(stintSummary.bestClosingLap.time) : 'N/A'}</div>
                  <div className="pace-window-detail">{stintSummary.bestClosingLap?.label || 'No clean stints'}</div>
                </div>
              </div>

              {stintInsights.length > 0 ? (
                <div className="stint-insights-list">
                  {stintInsights.map((stint) => (
                    <div key={stint.label} className="stint-insight-row">
                      <div>
                        <div className="stint-insight-title">{stint.label}</div>
                        <div className="stint-insight-subtitle">Laps {stint.startLap}-{stint.endLap} ({stint.lapCount} laps)</div>
                      </div>
                      <div className="stint-insight-metrics">
                        <div className="stint-insight-metric">
                          <span className="text-muted">Fastest Lap</span>
                          <strong>{msToTime(stint.bestLapTime)}</strong>
                          <small className="text-muted">Lap {stint.bestLapNumber}</small>
                        </div>
                        <div className="stint-insight-metric">
                          <span className="text-muted">Pace Spread</span>
                          <strong>{stint.paceSpreadMs != null ? `+${(stint.paceSpreadMs / 1000).toFixed(3)}s` : 'N/A'}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted">Not enough clean laps to show stint pace.</div>
              )}
          </Card.Body>
        </Card>
        </Col>
      </Row>
    </div>
  );
};

const getMedian = (values) => {
  if (!values.length) return 0;
  const middleIndex = Math.floor(values.length / 2);
  if (values.length % 2 === 0) {
    return (values[middleIndex - 1] + values[middleIndex]) / 2;
  }
  return values[middleIndex];
};

const buildStintInsights = (laps, pitAffectedLaps) => {
  const stints = [];
  let currentStint = [];

  laps.forEach((lap) => {
    const lapNumber = lap.attributes_Lap;
    const lapTime = lap.attributes_LapTime;

    if (pitAffectedLaps.has(lapNumber)) {
      if (currentStint.length) {
        stints.push(currentStint);
        currentStint = [];
      }
      return;
    }

    if (lapTime > 0) {
      currentStint.push(lap);
    }
  });

  if (currentStint.length) {
    stints.push(currentStint);
  }

  return stints
    .filter((stint) => stint.length >= 2)
    .map((stint, index) => {
      const sampleSize = Math.min(2, stint.length);
      const openingWindow = stint.slice(0, sampleSize);
      const openingAvg = averageLapTime(openingWindow);
      const openingLapTime = stint[0].attributes_LapTime;
      const closingLapTime = stint[stint.length - 1].attributes_LapTime;
      const bestLap = stint.reduce((best, lap) => (
        !best || lap.attributes_LapTime < best.attributes_LapTime ? lap : best
      ), null);
      const bestLapTime = bestLap?.attributes_LapTime ?? null;
      const stintAverage = averageLapTime(stint);

      return {
        label: `Stint ${index + 1}`,
        startLap: stint[0].attributes_Lap,
        endLap: stint[stint.length - 1].attributes_Lap,
        lapCount: stint.length,
        openingAvg,
        openingLapTime,
        closingLapTime,
        bestLapTime,
        bestLapNumber: bestLap?.attributes_Lap ?? null,
        paceSpreadMs: Math.round(stintAverage - bestLapTime)
      };
    });
};

const averageLapTime = (laps) => {
  const total = laps.reduce((sum, lap) => sum + lap.attributes_LapTime, 0);
  return Math.round(total / laps.length);
};

const buildPaceWindows = (cleanLaps) => {
  const bestThree = getBestRollingWindow(cleanLaps, 3);
  const bestFive = getBestRollingWindow(cleanLaps, 5);

  return {
    bestThreeLapAvg: bestThree?.avg ?? null,
    bestThreeLapRange: bestThree ? `Laps ${bestThree.startLap}-${bestThree.endLap}` : null,
    bestFiveLapAvg: bestFive?.avg ?? null,
    bestFiveLapRange: bestFive ? `Laps ${bestFive.startLap}-${bestFive.endLap}` : null
  };
};

const getBestRollingWindow = (laps, windowSize) => {
  if (laps.length < windowSize) return null;

  let bestWindow = null;

  for (let index = 0; index <= laps.length - windowSize; index += 1) {
    const window = laps.slice(index, index + windowSize);
    const avg = averageLapTime(window);

    if (!bestWindow || avg < bestWindow.avg) {
      bestWindow = {
        avg,
        startLap: window[0].attributes_Lap,
        endLap: window[window.length - 1].attributes_Lap
      };
    }
  }

  return bestWindow;
};

const buildStintSummary = (stintInsights, cleanLapCount) => {
  if (!stintInsights.length) {
    return {
      cleanLapCount,
      bestOpeningLap: null,
      bestClosingLap: null
    };
  }

  const bestOpeningLap = stintInsights.reduce((best, stint) => (
    !best || stint.openingLapTime < best.time
      ? { time: stint.openingLapTime, label: stint.label }
      : best
  ), null);

  const bestClosingLap = stintInsights.reduce((best, stint) => (
    !best || stint.closingLapTime < best.time
      ? { time: stint.closingLapTime, label: stint.label }
      : best
  ), null);

  return {
    cleanLapCount,
    bestOpeningLap,
    bestClosingLap
  };
};

const buildSectorInsights = (cleanLaps) => {
  const buildPaceSpread = (laps, key) => {
    const sectorTimes = laps
      .map((lap) => lap[key])
      .filter((time) => Number.isFinite(time) && time > 0);

    if (!sectorTimes.length) {
      return { paceSpreadMs: null, paceSpreadLabel: 'N/A' };
    }

    const bestTime = Math.min(...sectorTimes);
    const averageTime = sectorTimes.reduce((sum, time) => sum + time, 0) / sectorTimes.length;
    const paceSpreadMs = Math.round(averageTime - bestTime);

    return {
      paceSpreadMs,
      paceSpreadLabel: msToTime(paceSpreadMs)
    };
  };

  return {
    s1: buildPaceSpread(cleanLaps, 'attributes_Sector1Time'),
    s2: buildPaceSpread(cleanLaps, 'attributes_Sector2Time'),
    s3: buildPaceSpread(cleanLaps, 'attributes_Sector3Time')
  };
};

const getSectorBestHolders = (driverAnalytics) => {
  const entries = Object.entries(driverAnalytics || {});

  const getHolderName = (flagKey) => entries.find(([, driver]) => driver?.[flagKey])?.[1]?.name || null;

  return {
    s1: getHolderName('hasSessionBestS1'),
    s2: getHolderName('hasSessionBestS2'),
    s3: getHolderName('hasSessionBestS3')
  };
};

const getPaceSpreadLabel = (paceSpreadMs, fieldAvgPaceSpread) => {
  if (paceSpreadMs == null || fieldAvgPaceSpread == null || fieldAvgPaceSpread <= 0) {
    return { key: 'unknown', label: '—' };
  }

  const ratio = paceSpreadMs / fieldAvgPaceSpread;

  if (ratio <= 0.75) return { key: 'tight', label: 'More consistent than field' };
  if (ratio <= 1.1) return { key: 'good', label: 'Near field average' };
  if (ratio <= 1.4) return { key: 'moderate', label: 'Above field average' };
  return { key: 'high', label: 'High variability' };
};

export default ConsistencyTracker;