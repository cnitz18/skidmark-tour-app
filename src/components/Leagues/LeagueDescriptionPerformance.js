import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Container, Row, Col, Table, Form, Spinner, Badge, Card } from 'react-bootstrap';
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import getAPIData from "../../utils/getAPIData";
import NameMapper from '../../utils/Classes/NameMapper';
import './LeagueDescriptionPerformance.css';

const LeagueDescriptionPerformance = ({ showHistorySpinner, league, leagueHistory, leagueDetails, lists }) => {
  const [driverList, setDriverList] = useState([]);
  const [raceResultsObject, setRaceResultsObject] = useState({});
  const [qualiResultsObject, setQualiResultsObject] = useState({});
  const [selectedDriver, setSelectedDriver] = useState('');
  const [loading, setLoading] = useState(false);
  const [formattedData, setFormattedData] = useState({
    drivers: [],
    formTracking: [],
    consistencyRatings: [],
    peakPerformances: {},
    comebackFactors: []
  });
  const distributionScrollRef = useRef(null);
  const [isMobileDistributionView, setIsMobileDistributionView] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  });
  const [distributionOverflowInfo, setDistributionOverflowInfo] = useState({
    hiddenLeftFinishes: 0,
    hiddenRightFinishes: 0,
  });
  const [chartColors, setChartColors] = useState({
    primary: '#00a8e1',
    accent: '#f7a800',
    success: '#4caf50',
    danger: '#d32f2f',
    warning: '#ff9800',
    border: '#dee2e6',
  });

  // Resolve CSS custom properties to actual hex values for Recharts (SVG can't use CSS vars)
  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    const get = (v) => style.getPropertyValue(v).trim();
    setChartColors({
      primary: get('--color-secondary') || '#00a8e1',
      accent: get('--color-accent') || '#f7a800',
      success: get('--color-success') || '#4caf50',
      danger: get('--color-danger') || '#d32f2f',
      warning: get('--color-warning') || '#ff9800',
      border: get('--color-border') || '#dee2e6',
    });
  }, []);

  // Process league data when it changes
  useEffect(() => {
    if (leagueHistory?.length && leagueDetails?.scoreboard_entries?.length) {
      setLoading(true);
      
      try {
        // Extract driver list
        const drivers = leagueDetails.scoreboard_entries.map(entry => entry.PlayerName);
        setDriverList(drivers);

        if (drivers.length && !selectedDriver) {
          setSelectedDriver(drivers[0]);
        }

        var fetchRacesArray = [];
        var racesObj = {}, qualiObj = {};
        leagueHistory.map((hist) => [hist.stages?.race1?.id, hist.stages?.qualifying1?.id, hist.finished])
        .forEach(([raceId, qualiId, finished], i) => {
          if( raceId && finished !== false ){
            fetchRacesArray.push(
              getAPIData(`/api/batchupload/sms_stats_data/results/?stage_id=${raceId}`)
              .then((raceRes) => {
                if (!raceRes) return null;
                raceRes = raceRes.map((e) => {
                  e.RaceWeek = leagueHistory.length - i;
                  return e;
                });
                if( qualiId ){
                  return getAPIData(`/api/batchupload/sms_stats_data/results/?stage_id=${qualiId}`)
                  .then((qualiRes) => {
                    if (!qualiRes) return raceRes;
                    var stageId = qualiRes[0]?.stage;
                    qualiObj[stageId] = qualiRes.map((e) => { e.RaceWeek = leagueHistory.length - i; return e; });
                    raceRes = raceRes.map((r) => {
                      var qualiPerformance = qualiRes.find(q => q.name === r.name);
                      if( qualiPerformance ){
                        r.QualifyingPosition = qualiPerformance.RacePosition;
                      }
                      return r;
                    })
                    return raceRes;
                  });
                }
                return raceRes;
              })
            )
          }
        });

        Promise.all(fetchRacesArray).then((raceRes) => {
          raceRes.forEach((res) => {
            if (!res) return;
            var stageId = res[0]?.stage;
            racesObj[stageId] = res;
          })
          setRaceResultsObject(racesObj);
          setQualiResultsObject(qualiObj);
        });
      } catch (error) {
        console.error("Error processing performance data:", error);
      }
      
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueHistory, leagueDetails]);

  useEffect(() => {
    // Process data for each visualization
    if (!raceResultsObject || Object.keys(raceResultsObject).length === 0 ) return;
    
    const processedData = {
      drivers: driverList,
      formTracking: processFormTrackingData(leagueHistory, driverList),
      consistencyRatings: processConsistencyData(leagueHistory, driverList),
      peakPerformances: processPeakPerformanceData(leagueHistory, driverList),
      comebackFactors: processComebackData(leagueHistory, driverList)
    };
    
    setFormattedData(processedData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raceResultsObject]);
  
  // Generate data for Form Tracker
  const processFormTrackingData = (history, drivers) => {
    // Group races by event and order chronologically
    const eventGroups = {};
    
    history
    .sort((a,b) => b.end_time - a.end_time)
    .forEach((event,i) => {
      eventGroups[history.length-i] = event;
    });

    const raceWeeks = Object.keys(eventGroups)
      .map(Number)
      .sort((a, b) => b - a)
      .reverse();
    
    // Format data for the form chart
    const formData = raceWeeks.map(week => {
      const weekEvents = eventGroups[week] || {};
      const result = {
        name: `Week ${week}`,
        track: weekEvents?.setup?.TrackId ? (NameMapper.fromTrackApiName(NameMapper.fromTrackId(weekEvents.setup.TrackId, lists["tracks"]?.list)) || NameMapper.fromTrackId(weekEvents.setup.TrackId, lists["tracks"]?.list)) : `Race ${week}`
      };

      // Add position for each driver
      drivers.forEach(driver => {
        const results = raceResultsObject[weekEvents.stages?.race1?.id];
        if (results && Array.isArray(results)) {
          const driverEvent = results.find(e => e?.name === driver);
          result[driver] = driverEvent?.RacePosition || null;
        } else {
          result[driver] = null;
        }
      });

      return result;
    });
    
    return formData;
  };
  
  // Process consistency data
  const processConsistencyData = (history, drivers) => {
    const driverStats = {};
    
    // Initialize stats for each driver
    drivers.forEach(driver => {
      driverStats[driver] = {
        positions: [],
        qualifying: [],
        dnfs: 0,
        totalRaces: 0,
        avgQualiPercentile: 0,
      };
    });

    // Collect race positions and DNFs for each driver
    var totalQualifyingEvents = 0;
    Object.values(raceResultsObject).forEach(event => {
      var racersQualified = Object.values(qualiResultsObject).find((res) => res[0].RaceWeek === event[0].RaceWeek)?.map((e) => e.name);
      var numRacersQualified = racersQualified?.length ?? 0;

      if( numRacersQualified > 0 ){
        totalQualifyingEvents++;
      }

      event.forEach((result) => {
        const driver = result.name
        racersQualified?.splice(racersQualified.indexOf(driver), 1);
        if (driverStats[driver]) {
          if( result.QualifyingPosition ){
            driverStats[driver].qualifying.push(result.QualifyingPosition)
            var thisQualiPercentile = (numRacersQualified - (result.QualifyingPosition-1) ) / numRacersQualified * 100;
            var avgQualiPercentile = totalQualifyingEvents > 1 ?
              ((driverStats[driver].avgQualiPercentile * totalQualifyingEvents) + thisQualiPercentile) / (totalQualifyingEvents + 1) :
              thisQualiPercentile;
            driverStats[driver].avgQualiPercentile = avgQualiPercentile;
          }
          driverStats[driver].positions.push(result.RacePosition);
          driverStats[driver].totalRaces++;

          
          if (event.State === "Retired") {
            driverStats[driver].dnfs++;
          }
        }
      })

      // if a racer qualified but didn't finish the race, count it as a DNF
      racersQualified?.forEach((driver) => {
        if( driverStats[driver] ){
          driverStats[driver].totalRaces++;
          driverStats[driver].dnfs++;
        }else {
          driverStats[driver] = {
            positions: [],
            qualifying: [],
            dnfs: 1,
            totalRaces: 1,
            avgQualiPercentile: 0,
          };
        }
      });
    });

    // Calculate consistency metrics
    return drivers.map(driver => {
      const stats = driverStats[driver];
      
      if (stats.totalRaces === 0) {
        return {
          name: driver,
          consistency: 0,
          finishRate: 0,
          avgPosition: 0,
          races: 0
        };
      }
      
      // Calculate standard deviation of positions for completed races
      const avgPosition = stats.positions.length > 0 ? 
        stats.positions.reduce((sum, pos) => sum + pos, 0) / stats.positions.length : 
        0;

      const avgQuali = stats.qualifying.length > 0 ? 
        stats.qualifying.reduce((sum, pos) => sum + pos, 0) / stats.qualifying.length : 
        0;
      
      const variance = stats.positions.length > 0 ?
        stats.positions.reduce((sum, pos) => sum + Math.pow(pos - avgPosition, 2), 0) / stats.positions.length :
        0;
      
      const stdDev = Math.sqrt(variance);
      
      // Normalize to a 0-10 scale where lower stdDev is better
      const maxStdDev = 10;
      const baseConsistencyScore = Math.max(0, 10 - (stdDev / maxStdDev * 10));
      
      // Apply DNF penalty - more DNFs means lower consistency
      const dnfRatio = stats.dnfs / stats.totalRaces;
      
      // Calculate final consistency score with DNF penalty
      // This formula reduces the consistency score based on DNF ratio
      // A driver with 50% DNFs would lose 50% of their consistency score
      const consistencyScore = baseConsistencyScore * (1 - (dnfRatio * 0.8));
      
      // Finish rate (non-DNF)
      const finishRate = (stats.totalRaces - stats.dnfs) / stats.totalRaces * 10;
      
      return {
        name: driver,
        consistency: parseFloat(consistencyScore.toFixed(1)),
        finishRate: parseFloat(finishRate.toFixed(1)),
        avgPosition: parseFloat(avgPosition.toFixed(1)),
        races: stats.totalRaces,
        dnfs: stats.dnfs,
        qualifying: parseFloat(avgQuali.toFixed(1)),
        qualifyingPercentile: stats.avgQualiPercentile,
        stdDev: parseFloat(stdDev.toFixed(2)),
        baseScore: parseFloat(baseConsistencyScore.toFixed(1))
      };
    });
  };
  
  // Process peak performance data
  const processPeakPerformanceData = (history, drivers) => {
    const tracks = {};
    const driverBests = {};
    
    // Initialize driver bests
    drivers.forEach(driver => {
      driverBests[driver] = {};
    });

    // Group by track and find best performances
    history.forEach((event, i) => {
      if (!event?.setup?.TrackId) return; // Skip if no track data
      
      const trackId = event.setup.TrackId;
      const track = NameMapper.fromTrackId(trackId, lists["tracks"]?.list) || 'Unknown Track';
      const weekId = history.length - i;

      if (!tracks[track]) {
        tracks[track] = { name: track, events: [] };
      }

      const resultsArray = raceResultsObject[event.stages?.race1?.id];
      if (!resultsArray || !Array.isArray(resultsArray)) return; // Skip if no results
      
      tracks[track].events.push(...resultsArray);
      
      drivers.forEach((driver) => {
        if (driverBests[driver]) {
          const result = resultsArray.find(e => e?.name === driver);
          if (result && result.RacePosition) {
            if (!driverBests[driver][track] || result.RacePosition < driverBests[driver][track].RacePosition) {
              result.RaceWeek = weekId;
              driverBests[driver][track] = result;
            }
          }
        }
      })
    });
    
    return {
      tracks: Object.values(tracks),
      driverBests
    };
  };
  
  // Process comeback data
  const processComebackData = (history, drivers) => {
    const comebacks = [];
    
    // Group races by event/week
    const eventGroups = {};
    history = history.map((h, i) => {
      h.RaceWeek = history.length - i;
      return h;
    })
    
    history.forEach((event,i) => {
      const key = `${event.RaceWeek}-${NameMapper.fromTrackId(event.setup.TrackId, lists["tracks"]?.list)}`;
      if (!eventGroups[key]) {
        eventGroups[key] = [];
      }
      eventGroups[key].push(event);
    });
    
    // Calculate qualifying to finish position deltas
    Object.values(eventGroups).reverse().forEach(events => {
      if (events.length === 0) return;
      
      const track = NameMapper.fromTrackApiName(NameMapper.fromTrackId(events[0].setup.TrackId, lists["tracks"]?.list));
      const week = events[0].RaceWeek;
      
      drivers.forEach(driver => {
        // const driverEvent = events.find(e => e.PlayerName === driver);
        const weekRaceResults = Object.values(raceResultsObject).find((res) => {
          return res[0].RaceWeek === week
        })
        const weekQualiResults = Object.values(qualiResultsObject).find((res) => {
          return res[0].RaceWeek === week
        });

        if (!weekRaceResults) return;
        const driverRaceEvent = weekRaceResults.find((res) => res.name === driver);
        const driverQualiEvent = weekQualiResults?.find((res) => res.name === driver);
        
        if (driverRaceEvent && driverRaceEvent.QualifyingPosition && driverRaceEvent.RacePosition) {
          const positionsDelta = driverRaceEvent.QualifyingPosition - driverRaceEvent.RacePosition;
          
          comebacks.push({
            driver,
            track,
            week,
            qualifying: driverRaceEvent.QualifyingPosition,
            finish: driverRaceEvent.RacePosition,
            delta: positionsDelta,
            isDNF: false,
          });
        }
        // DNFs, when the player leaves, do not register as race events
        else if( driverQualiEvent && !driverRaceEvent ) {
          const positionsDelta = driverQualiEvent.RacePosition - weekQualiResults.length;

          comebacks.push({
            driver,
            track,
            week,
            qualifying: driverQualiEvent.RacePosition,
            finish: weekQualiResults.length,
            delta: positionsDelta,
            isDNF: true,
          });
        }
      });
    });
    
    // Calculate aggregate comebacks by driver
    const driverComebacks = drivers.map(driver => {
      const driverRaces = comebacks.filter(c => c.driver === driver);
      
      if (driverRaces.length === 0) {
        return { name: driver, value: 0, races: 0 };
      }
      
      const totalDelta = driverRaces.reduce((sum, race) => sum + race.delta, 0);
      const avgDelta = totalDelta / driverRaces.length;
      
      return {
        name: driver,
        value: parseFloat(avgDelta.toFixed(1)),
        races: driverRaces.length,
        bestComeback: driverRaces.reduce((best, race) => race.delta > best.delta ? race : best, { delta: 0 })
      };
    });
    
    return {
      comebacks,
      driverComebacks
    };
  };
  
  // Handle driver selection
  const handleDriverChange = (event) => {
    setSelectedDriver(event.target.value);
  };

  // Get form data for selected driver
  const selectedDriverFormData = useMemo(() => {
    return formattedData.formTracking.map(week => ({
      name: week.name,
      track: week.track,
      position: week[selectedDriver]
    })).filter(data => data.position !== null);
  }, [formattedData.formTracking, selectedDriver]);
  
  // Get consistency data for selected driver
  const selectedDriverConsistency = useMemo(() => {
    return formattedData.consistencyRatings.find(d => d.name === selectedDriver) || {
      consistency: 0,
      finishRate: 0,
      qualifying: 0
    };
  }, [formattedData.consistencyRatings, selectedDriver]);
  
  // Get comeback data for selected driver
  const selectedDriverComebacks = useMemo(() => {
    return formattedData.comebackFactors.comebacks?.filter(c => c.driver === selectedDriver) || [];
  }, [formattedData.comebackFactors, selectedDriver]);

  // Scoreboard entry for the selected driver
  const scoreboard = useMemo(() => {
    return leagueDetails?.scoreboard_entries?.find(e => e.PlayerName === selectedDriver) ?? null;
  }, [leagueDetails, selectedDriver]);

  // Whether qualifying data is available for the selected driver
  const hasQualiData = useMemo(() => {
    return (selectedDriverConsistency.qualifying > 0) || selectedDriverComebacks.some(c => c.qualifying);
  }, [selectedDriverConsistency, selectedDriverComebacks]);

  // Merged chronological race list for the Season Results table
  const allDriverRaces = useMemo(() => {
    const weeks = new Map();
    selectedDriverFormData.forEach(race => {
      const week = parseInt(race.name.replace('Week ', ''), 10);
      weeks.set(week, { track: race.track, week, position: race.position, isDNF: false, qualifying: null });
    });
    selectedDriverComebacks.forEach(comeback => {
      if (weeks.has(comeback.week)) {
        const existing = weeks.get(comeback.week);
        existing.qualifying = comeback.qualifying;
        if (comeback.isDNF) existing.isDNF = true;
      } else if (comeback.isDNF) {
        weeks.set(comeback.week, {
          track: comeback.track, week: comeback.week,
          position: null, isDNF: true, qualifying: comeback.qualifying,
        });
      }
    });
    return [...weeks.values()].sort((a, b) => a.week - b.week);
  }, [selectedDriverFormData, selectedDriverComebacks]);

  // Data shaped for the Qualifying vs Race chart
  const qualiVsRaceData = useMemo(() => {
    return selectedDriverComebacks.map(c => ({
      track: c.track?.split(' ')[0] ?? c.track,
      fullTrack: c.track,
      qualifying: c.qualifying,
      finish: c.isDNF ? null : c.finish,
      isDNF: c.isDNF ?? false,
    }));
  }, [selectedDriverComebacks]);

  // Average qualifying / finish for the Qualifying vs Race summary line
  const { avgQuali, avgFinish } = useMemo(() => {
    if (!selectedDriverComebacks.length) return { avgQuali: null, avgFinish: null };
    const withQuali = selectedDriverComebacks.filter(c => c.qualifying);
    const withFinish = selectedDriverComebacks.filter(c => !c.isDNF && c.finish);
    return {
      avgQuali: withQuali.length ? withQuali.reduce((s, c) => s + c.qualifying, 0) / withQuali.length : null,
      avgFinish: withFinish.length ? withFinish.reduce((s, c) => s + c.finish, 0) / withFinish.length : null,
    };
  }, [selectedDriverComebacks]);

  // Field ranks for each stat (lower position number = higher rank for avgPos/quali/stdDev)
  const fieldRanks = useMemo(() => {
    const ratings = formattedData.consistencyRatings;
    if (!ratings.length || !selectedDriver) return {};
    const total = ratings.length;

    const findRank = (sorted) => sorted.findIndex(d => d.name === selectedDriver) + 1 || null;
    const label = (r, n) => {
      if (!r) return null;
      const suf = r === 1 ? 'st' : r === 2 ? 'nd' : r === 3 ? 'rd' : 'th';
      return `${r}${suf} of ${n}`;
    };

    const byAvgPos = findRank([...ratings].sort((a, b) => a.avgPosition - b.avgPosition));
    const byFinishRate = findRank([...ratings].sort((a, b) => b.finishRate - a.finishRate));
    const byStdDev = findRank([...ratings].sort((a, b) => (a.stdDev ?? 99) - (b.stdDev ?? 99)));
    const qualiDrivers = ratings.filter(d => d.qualifying > 0);
    const byQuali = findRank([...qualiDrivers].sort((a, b) => a.qualifying - b.qualifying));

    return {
      avgPosition: label(byAvgPos, total),
      finishRate: label(byFinishRate, total),
      consistency: label(byStdDev, total),
      qualifying: byQuali ? label(byQuali, qualiDrivers.length) : null,
    };
  }, [formattedData.consistencyRatings, selectedDriver]);

  // Position distribution: all finishes in the range [best..worst], zeros included between
  const positionDistribution = useMemo(() => {
    const positions = allDriverRaces
      .filter(r => !r.isDNF && r.position != null)
      .map(r => r.position);
    if (positions.length === 0) return { items: [], maxCount: 1 };
    const min = Math.min(...positions);
    const max = Math.max(...positions);
    const items = Array.from({ length: max - min + 1 }, (_, i) => {
      const pos = min + i;
      return { position: pos, count: positions.filter(p => p === pos).length };
    });
    return { items, maxCount: Math.max(...items.map(e => e.count), 1) };
  }, [allDriverRaces]);

  const fullPositionDistribution = useMemo(
    () => calculatePositionDistribution(formattedData.peakPerformances, selectedDriver),
    [formattedData.peakPerformances, selectedDriver]
  );

  const bestDistributionIndex = useMemo(
    () => fullPositionDistribution.findIndex((count) => count > 0),
    [fullPositionDistribution]
  );

  const updateDistributionOverflowInfo = useCallback(() => {
    const container = distributionScrollRef.current;
    if (!container) return;

    const viewportLeft = container.scrollLeft;
    const viewportRight = viewportLeft + container.clientWidth;
    let hiddenLeftFinishes = 0;
    let hiddenRightFinishes = 0;

    Array.from(container.querySelectorAll('[data-position-index]')).forEach((item) => {
      const positionIndex = Number(item.getAttribute('data-position-index'));
      const finishCount = fullPositionDistribution[positionIndex] || 0;
      const itemLeft = item.offsetLeft;
      const itemRight = itemLeft + item.offsetWidth;

      if (itemRight <= viewportLeft + 1) {
        hiddenLeftFinishes += finishCount;
      } else if (itemLeft >= viewportRight - 1) {
        hiddenRightFinishes += finishCount;
      }
    });

    setDistributionOverflowInfo({ hiddenLeftFinishes, hiddenRightFinishes });
  }, [fullPositionDistribution]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleViewportChange = (event) => {
      setIsMobileDistributionView(event.matches);
    };

    setIsMobileDistributionView(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleViewportChange);
      return () => mediaQuery.removeEventListener('change', handleViewportChange);
    }

    mediaQuery.addListener(handleViewportChange);
    return () => mediaQuery.removeListener(handleViewportChange);
  }, []);

  useEffect(() => {
    const container = distributionScrollRef.current;
    if (!container) return undefined;

    const handleScrollOrResize = () => updateDistributionOverflowInfo();
    handleScrollOrResize();

    container.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      container.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [updateDistributionOverflowInfo, selectedDriver]);

  useEffect(() => {
    const container = distributionScrollRef.current;
    if (!container || !isMobileDistributionView || bestDistributionIndex < 0) {
      updateDistributionOverflowInfo();
      return;
    }

    const targetItem = container.querySelector(`[data-position-index="${bestDistributionIndex}"]`);
    if (!targetItem) {
      updateDistributionOverflowInfo();
      return;
    }

    requestAnimationFrame(() => {
      container.scrollTo({ left: targetItem.offsetLeft, behavior: 'auto' });
      updateDistributionOverflowInfo();
    });
  }, [bestDistributionIndex, isMobileDistributionView, selectedDriver, updateDistributionOverflowInfo]);

  // Dynamic season highlights — tier-ranked, driver-specific, never shows 0-value stats
  const seasonHighlights = useMemo(() => {
    const highlights = [];
    const sb = scoreboard;
    const cons = selectedDriverConsistency;
    const raceCount = allDriverRaces.length;
    if (!raceCount) return [];

    const finishedRaces = allDriverRaces.filter(r => !r.isDNF && r.position != null);
    const bestPos = finishedRaces.length ? Math.min(...finishedRaces.map(r => r.position)) : null;
    const bestFinishRace = bestPos != null ? finishedRaces.find(r => r.position === bestPos) : null;

    // Tier 1 – championship / wins / poles
    if (sb?.Position != null && sb.Position <= 3)
      highlights.push({ tier: 1, label: sb.Position === 1 ? 'Championship Leader' : `P${sb.Position} in Championship`, value: `${sb.Points} pts` });
    if ((sb?.Wins ?? 0) > 0)
      highlights.push({ tier: 1, label: sb.Wins === 1 ? 'Race Win' : 'Race Wins', value: sb.Wins });
    if ((sb?.Poles ?? 0) > 0)
      highlights.push({ tier: 1, label: sb.Poles === 1 ? 'Pole Position' : 'Pole Positions', value: sb.Poles });

    // Tier 2 – podiums / fastest laps
    const extraPodiums = (sb?.Podiums ?? 0) - (sb?.Wins ?? 0);
    if (extraPodiums > 0)
      highlights.push({ tier: 2, label: 'Podiums', value: sb.Podiums });
    if ((sb?.FastestLaps ?? 0) > 0)
      highlights.push({ tier: 2, label: 'Fastest Lap' + (sb.FastestLaps > 1 ? 's' : ''), value: sb.FastestLaps });

    // Best finish (skip if already covered by wins/podiums)
    if (bestPos != null && (sb?.Podiums ?? 0) === 0)
      highlights.push({ tier: bestPos <= 5 ? 2 : 3, label: 'Best Finish', value: `P${bestPos}`, sub: bestFinishRace?.track ?? null });

    // Best qualifying
    if (hasQualiData && (sb?.Poles ?? 0) === 0) {
      const bestQuali = selectedDriverComebacks.filter(c => c.qualifying).reduce((b, c) => Math.min(b, c.qualifying), Infinity);
      if (bestQuali !== Infinity)
        highlights.push({ tier: bestQuali <= 3 ? 2 : 3, label: 'Best Qualifying', value: `P${bestQuali}` });
    }

    // Best recovery (positions gained in a single race)
    const bestComebackItem = selectedDriverComebacks
      .filter(c => !c.isDNF && c.delta > 0)
      .reduce((b, c) => (b === null || c.delta > b.delta) ? c : b, null);
    if (bestComebackItem)
      highlights.push({ tier: 3, label: 'Best Recovery', value: `+${bestComebackItem.delta}`, sub: bestComebackItem.track ?? null });

    // Points finishes
    if ((sb?.PointsFinishes ?? 0) > 0)
      highlights.push({ tier: 3, label: 'Points Finishes', value: sb.PointsFinishes, sub: `${Math.round(sb.PointsFinishes / raceCount * 100)}% of races` });

    // Finish rate (only if there were any DNFs and rate is solid)
    const finishRate = finishedRaces.length / raceCount * 100;
    if (finishRate >= 80 && finishedRaces.length < raceCount)
      highlights.push({ tier: 4, label: 'Finish Rate', value: `${finishRate.toFixed(0)}%` });

    // vs field average finish (only if favourable)
    const allRatings = formattedData.consistencyRatings;
    if (allRatings.length > 1 && cons.avgPosition > 0) {
      const others = allRatings.filter(d => d.name !== selectedDriver);
      const fieldAvg = others.reduce((s, d) => s + d.avgPosition, 0) / others.length;
      const diff = parseFloat((fieldAvg - cons.avgPosition).toFixed(1));
      if (diff >= 1)
        highlights.push({ tier: 4, label: 'vs. Field Avg', value: `${diff.toFixed(1)} pos ahead` });
    }

    highlights.sort((a, b) => a.tier - b.tier);

    // Absolute fallback — always show something
    if (highlights.length === 0 && bestPos != null)
      highlights.push({ tier: 5, label: 'Best Finish', value: `P${bestPos}`, sub: bestFinishRace?.track ?? null });

    return highlights.slice(0, 5);
  }, [scoreboard, selectedDriverConsistency, allDriverRaces, hasQualiData, selectedDriverComebacks, formattedData.consistencyRatings, selectedDriver]);

  // Finish rate as a percentage string
  const finishRatePct = selectedDriverConsistency.finishRate != null
    ? (selectedDriverConsistency.finishRate / 10 * 100).toFixed(1)
    : '—';

  // Average positions gained from qualifying grid to race finish
  const avgGridGain = useMemo(() => {
    const valid = selectedDriverComebacks.filter(c => !c.isDNF && c.delta != null);
    if (!valid.length) return null;
    return parseFloat((valid.reduce((s, c) => s + c.delta, 0) / valid.length).toFixed(1));
  }, [selectedDriverComebacks]);

  // Best / worst race finish and qualifying positions
  const bestWorstStats = useMemo(() => {
    const finishPos = allDriverRaces.filter(r => !r.isDNF && r.position != null).map(r => r.position);
    const qualiPos  = allDriverRaces.filter(r => r.qualifying != null).map(r => r.qualifying);
    return {
      bestFinish:  finishPos.length ? Math.min(...finishPos) : null,
      worstFinish: finishPos.length ? Math.max(...finishPos) : null,
      bestQuali:   qualiPos.length  ? Math.min(...qualiPos)  : null,
      worstQuali:  qualiPos.length  ? Math.max(...qualiPos)  : null,
    };
  }, [allDriverRaces]);

  const formatHiddenFinishLabel = (count) => `${count} more ${count === 1 ? 'finish' : 'finishes'}`;

  // Render loading state
  if (loading) {
    return (
      <Container className="text-center p-5">
        <Spinner animation="border" role="status" variant="primary"/>
        <p className="mt-3 text-muted">Processing performance analytics...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="perf-analytics p-0">
      {/* Driver Picker */}
      <Row className="mb-4">
        <Col xs={12}>
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="m-0">Season stats for {selectedDriver}</h4>
            {!showHistorySpinner && (
              <Form.Select
                value={selectedDriver}
                onChange={handleDriverChange}
                style={{ width: 'auto' }}
              >
                {formattedData.drivers.map(driver => (
                  <option key={driver} value={driver}>{driver}</option>
                ))}
              </Form.Select>
            )}
          </div>
        </Col>
      </Row>

      {showHistorySpinner ? (
        <div className="text-center mt-4">
          <Spinner animation="border" role="status" />
          <div className="mt-2">This may take a moment…</div>
        </div>
      ) : (
        <>
          {/* ── Section 1: Driver Summary ── */}
          <Card className="mb-4">
            <Card.Body className="py-3">
              <div className="perf-summary-grid">
                {[
                  { label: 'Position',     value: scoreboard?.Position != null ? `P${scoreboard.Position}` : '—' },
                  { label: 'Points',       value: scoreboard?.Points ?? '—' },
                  { label: 'Wins',         value: scoreboard?.Wins ?? 0 },
                  { label: 'Podiums',      value: scoreboard?.Podiums ?? 0 },
                  { label: 'Poles',        value: scoreboard?.Poles ?? 0 },
                  { label: 'Fastest Laps', value: scoreboard?.FastestLaps ?? 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="perf-summary-stat">
                    <div className="perf-summary-label">{label}</div>
                    <div className="perf-summary-value">{value}</div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
          {/* ── Section 2: Season Results ── */}
          <Card className="mb-4">
            <Card.Header><h5 className="mb-0">Season Results</h5></Card.Header>
            <Card.Body>
              {allDriverRaces.length > 0 ? (
                <>
                  <div className="perf-chart-wrap mb-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={qualiVsRaceData.length > 0 ? qualiVsRaceData : allDriverRaces.filter(r => !r.isDNF).map(r => ({ track: r.track?.split(' ')[0] ?? r.track, fullTrack: r.track, finish: r.position, isDNF: r.isDNF }))}
                        margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis
                          dataKey="track"
                          tick={{ fontSize: 11, fill: 'var(--color-text-secondary)', fontFamily: 'var(--font-primary)' }}
                        />
                        <YAxis
                          reversed
                          domain={[1, (dataMax) => Math.max(dataMax + 1, 5)]}
                          tickFormatter={(v) => `P${v}`}
                          tick={{ fontSize: 11, fill: 'var(--color-text-secondary)', fontFamily: 'var(--font-primary)' }}
                          width={36}
                          allowDecimals={false}
                        />
                        <Tooltip
                          formatter={(value, name) => value != null ? [`P${value}`, name] : ['DNF', name]}
                          labelFormatter={(_, payload) => payload?.[0]?.payload?.fullTrack ?? payload?.[0]?.payload?.track ?? ''}
                          contentStyle={{
                            background: 'var(--color-bg-elevated)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            fontFamily: 'var(--font-primary)',
                            fontSize: '0.85rem',
                          }}
                        />
                        {hasQualiData && qualiVsRaceData.length > 0 && (
                          <>
                            <Legend wrapperStyle={{ fontFamily: 'var(--font-primary)', fontSize: '0.82rem', paddingTop: '8px' }} />
                            <Line
                              type="monotone"
                              dataKey="qualifying"
                              name="Qualifying"
                              stroke={chartColors.accent}
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              dot={(props) => {
                                const { cx, cy, payload, key } = props;
                                if (payload?.isDNF) {
                                  return (
                                    <g key={key}>
                                      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill={chartColors.danger} fontSize={14} fontWeight="bold">✕</text>
                                    </g>
                                  );
                                }
                                return <circle key={key} cx={cx} cy={cy} r={4} fill={chartColors.accent} stroke="none" />;
                              }}
                              activeDot={{ r: 6 }}
                            />
                          </>
                        )}
                        <Line
                          type="monotone"
                          dataKey="finish"
                          name="Race Finish"
                          stroke={chartColors.primary}
                          strokeWidth={2}
                          connectNulls={false}
                          dot={{ r: 4, fill: chartColors.primary, stroke: 'var(--color-bg-elevated)', strokeWidth: 2 }}
                          activeDot={{ r: 7 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {(avgQuali != null || avgFinish != null || (qualiVsRaceData.length > 0 && qualiVsRaceData.some(r => r.isDNF))) && (
                    <div className="d-flex flex-wrap gap-3 mb-3">
                      {avgQuali != null && <small className="text-muted">Avg. qualifying: P{avgQuali.toFixed(1)}</small>}
                      {avgFinish != null && <small className="text-muted">Avg. race finish: P{avgFinish.toFixed(1)}</small>}
                      {qualiVsRaceData.some(r => r.isDNF) && (
                        <small className="text-muted"><span style={{ color: chartColors.danger }}>✕</span> = DNF</small>
                      )}
                    </div>
                  )}
                  <div className="perf-results-table-wrap">
                    <Table size="sm" className="perf-results-table mb-0">
                      <thead>
                        <tr>
                          <th>Rnd</th>
                          <th>Track</th>
                          {hasQualiData && <th className="text-center">Qual</th>}
                          <th className="text-center">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allDriverRaces.map((race, idx) => (
                          <tr key={idx}>
                            <td className="text-muted perf-rnd-cell">{race.week}</td>
                            <td>{race.track}</td>
                            {hasQualiData && (
                              <td className="text-center">
                                {race.qualifying
                                  ? <span className="perf-position-text">P{race.qualifying}</span>
                                  : <span className="text-muted">—</span>}
                              </td>
                            )}
                            <td className="text-center">
                              {race.isDNF ? (
                                <Badge bg="danger" className="perf-dnf-badge">DNF</Badge>
                              ) : (
                                <span className={`perf-position-badge ${race.position === 1 ? 'pos-win' : race.position <= 3 ? 'pos-podium' : race.position <= 10 ? 'pos-points' : ''}`}>
                                  P{race.position}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </>
              ) : (
                <p className="text-muted mb-0">No race data available.</p>
              )}
            </Card.Body>
          </Card>

          {/* ── Section 3: Performance Stats ── */}
          <Card className="mb-4">
            <Card.Header><h5 className="mb-0">Performance Stats</h5></Card.Header>
            <Card.Body>
              <div className="perf-stat-grid">
                <div className="perf-stat-card">
                  <div className="perf-stat-label">Best Finish</div>
                  <div className="perf-stat-value">
                    {bestWorstStats.bestFinish != null ? `P${bestWorstStats.bestFinish}` : '—'}
                  </div>
                </div>
                <div className="perf-stat-card">
                  <div className="perf-stat-label">Worst Finish</div>
                  <div className="perf-stat-value">
                    {bestWorstStats.worstFinish != null ? `P${bestWorstStats.worstFinish}` : '—'}
                  </div>
                </div>
                <div className="perf-stat-card">
                  <div className="perf-stat-label">Avg Finish</div>
                  <div className="perf-stat-value">
                    {selectedDriverConsistency.avgPosition > 0 ? `P${selectedDriverConsistency.avgPosition}` : '—'}
                  </div>
                  {fieldRanks.avgPosition && (
                    <div className="perf-stat-rank">{fieldRanks.avgPosition}</div>
                  )}
                </div>
                <div className="perf-stat-card">
                  <div className="perf-stat-label">Finish Rate</div>
                  <div className="perf-stat-value">{finishRatePct}%</div>
                  {fieldRanks.finishRate && (
                    <div className="perf-stat-rank">{fieldRanks.finishRate}</div>
                  )}
                </div>
                {hasQualiData && (
                  <div className="perf-stat-card">
                    <div className="perf-stat-label">Best Qualifying</div>
                    <div className="perf-stat-value">
                      {bestWorstStats.bestQuali != null ? `P${bestWorstStats.bestQuali}` : '—'}
                    </div>
                  </div>
                )}
                {hasQualiData && (
                  <div className="perf-stat-card">
                    <div className="perf-stat-label">Worst Qualifying</div>
                    <div className="perf-stat-value">
                      {bestWorstStats.worstQuali != null ? `P${bestWorstStats.worstQuali}` : '—'}
                    </div>
                  </div>
                )}
                {hasQualiData && (
                  <div className="perf-stat-card">
                    <div className="perf-stat-label">Avg Qualifying</div>
                    <div className="perf-stat-value">
                      {selectedDriverConsistency.qualifying > 0 ? `P${selectedDriverConsistency.qualifying}` : '—'}
                    </div>
                    {fieldRanks.qualifying && (
                      <div className="perf-stat-rank">{fieldRanks.qualifying}</div>
                    )}
                  </div>
                )}
                {hasQualiData && (
                  <div className="perf-stat-card">
                    <div className="perf-stat-label">Grid Gain</div>
                    <div className="perf-stat-value">
                      {avgGridGain != null
                        ? (avgGridGain > 0 ? `+${avgGridGain}` : `${avgGridGain}`)
                        : '—'}
                    </div>
                    <div className="perf-stat-detail">avg positions gained</div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* ── Section 5: Season Highlights ── */}
          <Card className="mb-4">
            <Card.Header><h5 className="mb-0">Season Highlights</h5></Card.Header>
            <Card.Body>
              {allDriverRaces.length > 0 ? (
                <>
                  {/* Dynamic highlights grid */}
                  {seasonHighlights.length > 0 && (
                    <div className="perf-highlights-grid mb-4">
                      {seasonHighlights.map((h, idx) => (
                        <div key={idx} className={`perf-highlight-card${h.tier <= 1 ? ' tier-1' : h.tier <= 2 ? ' tier-2' : ''}`}>
                          <div className="perf-highlight-label">{h.label}</div>
                          <div className="perf-highlight-value">{h.value}</div>
                          {h.sub && <div className="perf-highlight-sub">{h.sub}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Position distribution — CSS vertical bars */}
                  {positionDistribution.items.length > 0 && (
                    <>
                      <h6 className="mb-3 perf-section-sub-heading">Position Distribution</h6>
                        <div className="performance-distribution-shell">
                          {isMobileDistributionView && (
                            <div className="performance-distribution-hints">
                              <div className={`performance-distribution-hint ${distributionOverflowInfo.hiddenLeftFinishes > 0 ? 'is-visible' : ''}`}>
                                {distributionOverflowInfo.hiddenLeftFinishes > 0 ? `< ${formatHiddenFinishLabel(distributionOverflowInfo.hiddenLeftFinishes)}` : ''}
                              </div>
                              <div className={`performance-distribution-hint ${distributionOverflowInfo.hiddenRightFinishes > 0 ? 'is-visible' : ''}`}>
                                {distributionOverflowInfo.hiddenRightFinishes > 0 ? `${formatHiddenFinishLabel(distributionOverflowInfo.hiddenRightFinishes)} >` : ''}
                              </div>
                            </div>
                          )}
                          <div
                            ref={distributionScrollRef}
                            className={`performance-distribution d-flex align-items-end ${isMobileDistributionView ? 'is-mobile-scroll' : ''}`}
                            style={{ padding: '20px 10px 10px', justifyContent: isMobileDistributionView ? 'flex-start' : 'center' }}>
                            {fullPositionDistribution.map((count, position) => {
                              const barHeight = count > 0 ? Math.max(count * 25, 30) : 0;
                              const showCountInside = barHeight > 40;
                              
                              return (
                                <div key={position} data-position-index={position} className="performance-distribution-item d-flex flex-column align-items-center" style={{ width: '45px' }}>
                                  <div className="position-relative" style={{ height: barHeight + (showCountInside ? 0 : 20), width: '100%' }}>
                                    {count > 0 && !showCountInside && (
                                      <div className="position-count" style={{
                                        position: 'absolute',
                                        top: '-20px',
                                        left: '0',
                                        width: '100%',
                                        textAlign: 'center',
                                        fontSize: '0.9rem',
                                        fontWeight: '500'
                                      }}>
                                        {count}
                                      </div>
                                    )}
                                    <div 
                                      className={`position-bar ${position < 3 ? 'podium' : position < 8 ? 'points' : ''}`}
                                      style={{ 
                                        height: `${barHeight}px`,
                                        width: '20px',
                                        position: 'absolute',
                                        bottom: '0',
                                        left: '50%',
                                        transform: 'translateX(-50%)'
                                      }}
                                    >
                                      {count > 0 && showCountInside && (
                                        <div className="position-count" style={{
                                          position: 'absolute',
                                          top: '50%',
                                          left: '50%',
                                          transform: 'translate(-50%, -50%)',
                                          color: 'white',
                                          fontWeight: 'bold',
                                          fontSize: '0.9rem'
                                        }}>
                                          {count}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="position-label mt-1" style={{ textAlign: 'center', width: '100%' }}>P{position + 1}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                    </>
                  )}
                </>
              ) : (
                <p className="text-muted mb-0">No race data available.</p>
              )}
            </Card.Body>
          </Card>
        </>
      )}
    </Container>
  );
};

// Helper function to calculate position distribution
const calculatePositionDistribution = (peakData, driver) => {
  const distribution = Array(20).fill(0);
  
  if (!peakData.driverBests || !peakData.driverBests[driver]) {
    return distribution;
  }

  Object.values(peakData.driverBests[driver]).filter(ent => ent !== undefined).forEach(performance => {
    const position = performance.RacePosition - 1;  // 0-based index
    if (position >= 0 && position < distribution.length) {
      distribution[position]++;
    }
  });
  
  return distribution;
};

export default LeagueDescriptionPerformance;
