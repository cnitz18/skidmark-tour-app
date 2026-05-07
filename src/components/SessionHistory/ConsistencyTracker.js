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
  const stdDevMs = analyticsData?.stdDev ?? 0;
  const consistencyLabel = getConsistencyLabel(stdDevMs);
  const fieldComparison = analyticsData?.fieldComparison;

  return (
    <div className="consistency-tracker">
      <Row className="mb-4">
        <Col md={6}>
          <Card className="h-100 consistency-card">
            <Card.Body>
              <h5 className="mb-3">Sustained Pace</h5>

              <div className="consistency-std-display mb-3">
                <div className="consistency-std-stack mb-1">
                  <span className="consistency-std-value">{(stdDevMs / 1000).toFixed(3)}s</span>
                  <span className={`consistency-std-label-badge consistency-${consistencyLabel.key}`}>{consistencyLabel.label}</span>
                </div>
                <small className="text-muted">Standard deviation across clean laps (pit stops &amp; outliers excluded)</small>
              </div>

              <div className="pace-window-grid mb-3">
                <div className="pace-window-card">
                  <div className="pace-window-label">Best 3-Lap Run</div>
                  <div className="pace-window-value">{paceWindows.bestThreeLapAvg ? msToTime(paceWindows.bestThreeLapAvg) : 'N/A'}</div>
                  <div className="pace-window-detail">{paceWindows.bestThreeLapRange || 'Not enough clean laps'}</div>
                </div>
                <div className="pace-window-card">
                  <div className="pace-window-label">Best 5-Lap Run</div>
                  <div className="pace-window-value">{paceWindows.bestFiveLapAvg ? msToTime(paceWindows.bestFiveLapAvg) : 'N/A'}</div>
                  <div className="pace-window-detail">{paceWindows.bestFiveLapRange || 'Not enough clean laps'}</div>
                </div>
                <div className="pace-window-card">
                  <div className="pace-window-label">Longest Clean Run</div>
                  <div className="pace-window-value">{paceWindows.longestRunAvg ? msToTime(paceWindows.longestRunAvg) : 'N/A'}</div>
                  <div className="pace-window-detail">{paceWindows.longestRunLabel || 'No uninterrupted run found'}</div>
                </div>
                <div className="pace-window-card">
                  <div className="pace-window-label">Run Fade</div>
                  <div className={`pace-window-value ${paceWindows.longestRunFadeMs <= 150 ? 'is-positive' : paceWindows.longestRunFadeMs <= 500 ? 'is-neutral' : 'is-negative'}`}>
                    {paceWindows.longestRunFadeMs != null ? `${paceWindows.longestRunFadeMs > 0 ? '+' : ''}${(paceWindows.longestRunFadeMs / 1000).toFixed(3)}s` : 'N/A'}
                  </div>
                  <div className="pace-window-detail">{paceWindows.longestRunFadeLabel || 'Need at least two laps in run'}</div>
                </div>
              </div>

              <div className="consistency-details">
                <div className="detail-row d-flex justify-content-between mb-2">
                  <span>Lap Time Spread:</span>
                  <span className="fw-bold">{msToTime(analyticsData?.spread)}s <small className="text-muted">(fastest to slowest)</small></span>
                </div>
                <div className="detail-row d-flex justify-content-between">
                  <span>vs Field Average:</span>
                  {fieldComparison != null ? (
                    <span className={`fw-bold ${fieldComparison >= 0 ? 'text-success' : 'text-danger'}`}>
                      {fieldComparison > 0 ? '+' : ''}{fieldComparison.toFixed(1)}% {fieldComparison >= 0 ? 'tighter' : 'looser'}
                    </span>
                  ) : <span className="text-muted">N/A</span>}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100 improvement-card">
            <Card.Body>
              <h5 className="mb-3">Stint Pace &amp; Degradation</h5>
              <small className="text-muted d-block mb-3">Each stint is split around pit laps, then measured from its opening pace to closing pace.</small>

              <div className="stint-summary-grid mb-3">
                <div className="stint-summary-card">
                  <div className="stint-summary-label">Clean Stints</div>
                  <div className="stint-summary-value">{stintSummary.stintCount}</div>
                </div>
                <div className="stint-summary-card">
                  <div className="stint-summary-label">Clean Laps</div>
                  <div className="stint-summary-value">{stintSummary.cleanLapCount}</div>
                </div>
                <div className="stint-summary-card">
                  <div className="stint-summary-label">Best Stint Opening</div>
                  <div className="stint-summary-value">{stintSummary.bestOpeningAvg ? msToTime(stintSummary.bestOpeningAvg) : 'N/A'}</div>
                </div>
                <div className="stint-summary-card">
                  <div className="stint-summary-label">Worst Fade</div>
                  <div className="stint-summary-value">{stintSummary.worstFadeMs != null ? `${stintSummary.worstFadeMs > 0 ? '+' : ''}${(stintSummary.worstFadeMs / 1000).toFixed(3)}s` : 'N/A'}</div>
                </div>
              </div>

              {stintInsights.length > 0 ? (
                <div className="stint-insights-list">
                  {stintInsights.map((stint) => (
                    <div key={stint.label} className="stint-insight-row">
                      <div>
                        <div className="stint-insight-title">{stint.label}</div>
                        <div className="stint-insight-subtitle">Laps {stint.startLap}-{stint.endLap}</div>
                      </div>
                      <div className="stint-insight-metrics">
                        <div className="stint-insight-metric">
                          <span className="text-muted">Opening</span>
                          <strong>{msToTime(stint.openingAvg)}</strong>
                        </div>
                        <div className="stint-insight-metric">
                          <span className="text-muted">Closing</span>
                          <strong>{msToTime(stint.closingAvg)}</strong>
                        </div>
                        <div className="stint-insight-metric">
                          <span className={`stint-delta ${stint.degradationMs <= 150 ? 'is-stable' : stint.degradationMs <= 500 ? 'is-manageable' : 'is-fading'}`}>
                            {stint.degradationMs > 0 ? '+' : ''}{(stint.degradationMs / 1000).toFixed(3)}s
                          </span>
                          <small>{stint.degradationLabel}</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted">Not enough clean laps to calculate stint degradation.</div>
              )}
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
      const closingWindow = stint.slice(-sampleSize);
      const openingAvg = averageLapTime(openingWindow);
      const closingAvg = averageLapTime(closingWindow);
      const degradationMs = closingAvg - openingAvg;

      return {
        label: `Stint ${index + 1}`,
        startLap: stint[0].attributes_Lap,
        endLap: stint[stint.length - 1].attributes_Lap,
        lapCount: stint.length,
        openingAvg,
        closingAvg,
        degradationMs,
        degradationLabel: getDegradationLabel(degradationMs)
      };
    });
};

const averageLapTime = (laps) => {
  const total = laps.reduce((sum, lap) => sum + lap.attributes_LapTime, 0);
  return Math.round(total / laps.length);
};

const buildPaceWindows = (cleanLaps) => {
  const cleanRuns = buildCleanRuns(cleanLaps);
  const longestRun = cleanRuns.reduce((longest, run) => (run.length > longest.length ? run : longest), []);
  const bestThree = getBestRollingWindow(cleanLaps, 3);
  const bestFive = getBestRollingWindow(cleanLaps, 5);

  return {
    bestThreeLapAvg: bestThree?.avg ?? null,
    bestThreeLapRange: bestThree ? `Laps ${bestThree.startLap}-${bestThree.endLap}` : null,
    bestFiveLapAvg: bestFive?.avg ?? null,
    bestFiveLapRange: bestFive ? `Laps ${bestFive.startLap}-${bestFive.endLap}` : null,
    longestRunAvg: longestRun.length ? averageLapTime(longestRun) : null,
    longestRunLabel: longestRun.length ? `${longestRun.length} laps, Laps ${longestRun[0].attributes_Lap}-${longestRun[longestRun.length - 1].attributes_Lap}` : null,
    longestRunFadeMs: longestRun.length >= 2 ? averageLapTime(longestRun.slice(-2)) - averageLapTime(longestRun.slice(0, 2)) : null,
    longestRunFadeLabel: longestRun.length >= 2 ? getDegradationLabel(averageLapTime(longestRun.slice(-2)) - averageLapTime(longestRun.slice(0, 2))) : null
  };
};

const buildCleanRuns = (cleanLaps) => {
  if (!cleanLaps.length) return [];

  return cleanLaps.reduce((runs, lap) => {
    const currentRun = runs[runs.length - 1];
    if (!currentRun.length || currentRun[currentRun.length - 1].attributes_Lap + 1 === lap.attributes_Lap) {
      currentRun.push(lap);
    } else {
      runs.push([lap]);
    }
    return runs;
  }, [[]]).filter((run) => run.length > 0);
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
      stintCount: 0,
      cleanLapCount,
      bestOpeningAvg: null,
      worstFadeMs: null
    };
  }

  return {
    stintCount: stintInsights.length,
    cleanLapCount,
    bestOpeningAvg: Math.min(...stintInsights.map((stint) => stint.openingAvg)),
    worstFadeMs: Math.max(...stintInsights.map((stint) => stint.degradationMs))
  };
};

const getDegradationLabel = (degradationMs) => {
  if (degradationMs <= 150) return 'Stable';
  if (degradationMs <= 500) return 'Manageable fade';
  return 'Heavy fade';
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

// Translate raw std deviation (ms) to a human-readable label
const getConsistencyLabel = (stdDevMs) => {
  if (stdDevMs === 0) return { key: 'unknown', label: '—' };
  if (stdDevMs <= 300) return { key: 'tight', label: 'Very Tight' };
  if (stdDevMs <= 600) return { key: 'good', label: 'Good' };
  if (stdDevMs <= 1200) return { key: 'moderate', label: 'Moderate' };
  if (stdDevMs <= 2500) return { key: 'scattered', label: 'Scattered' };
  return { key: 'high', label: 'High Variability' };
};

export default ConsistencyTracker;