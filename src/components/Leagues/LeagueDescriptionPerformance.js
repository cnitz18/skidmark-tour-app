import { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Table, Form, Spinner, Badge } from 'react-bootstrap';
import { 
  LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ReferenceLine, Cell 
} from 'recharts';
import { Box, Tabs, Tab, Paper, Divider, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import getAPIData from "../../utils/getAPIData";
import NameMapper from '../../utils/Classes/NameMapper';
import './LeagueDescriptionPerformance.css';

// Custom tab panel component for nested tabs
function PerformanceTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`performance-tabpanel-${index}`}
      aria-labelledby={`performance-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

// Styled components
const StatsCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    boxShadow: theme.shadows[3]
  }
}));

const StatsCardHeader = styled('div')({
  marginBottom: '10px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
});

const DriverBadge = styled(Badge)({
  padding: '6px 10px',
  borderRadius: '16px',
  fontSize: '0.85rem',
  fontWeight: 500
});

// Custom legend
const renderCustomLegend = (props) => {
  const { payload } = props;
  
  return (
    <div className="custom-legend d-flex flex-wrap justify-content-center mb-3">
      {payload.map((entry, index) => (
        <div key={`item-${index}`} className="legend-item me-3 mb-2">
          <div
            className="legend-color"
            style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              backgroundColor: entry.color,
              marginRight: '5px',
              borderRadius: '2px'
            }}
          />
          <span className="legend-text">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

const LeagueDescriptionPerformance = ({ showHistorySpinner, league, leagueHistory, leagueDetails, lists }) => {
  const [selectedTab, setSelectedTab] = useState(0);
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
        leagueHistory.map((hist) => [hist.stages?.race1?.id,hist.stages?.qualifying1?.id])
        .forEach(([raceId,qualiId], i) => { 
          if( raceId ){
            fetchRacesArray.push(
              getAPIData(`/api/batchupload/sms_stats_data/results/?stage_id=${raceId}`)
              .then((raceRes) => {
                raceRes = raceRes.map((e) => {
                  e.RaceWeek = leagueHistory.length - i;
                  return e;
                });
                if( qualiId ){
                  return getAPIData(`/api/batchupload/sms_stats_data/results/?stage_id=${qualiId}`)
                  .then((qualiRes) => {
                    var stageId = qualiRes[0]?.stage;
                    qualiObj[stageId] = qualiRes.map((e) => { e.RaceWeek = leagueHistory.length - i; return e; });
                    raceRes = raceRes.map((r) => {
                      var qualiPerformance = qualiRes.find(q => q.participantid === r.participantid);
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
      const weekEvents = eventGroups[week] || [];
      const result = {
        name: `Week ${week}`,
        track: NameMapper.fromTrackId(weekEvents.setup.TrackId,lists["tracks"]?.list) || `Race ${week}`
      };

      // Add position for each driver
      drivers.forEach(driver => {
        var results = raceResultsObject[weekEvents.stages?.race1?.id];
        const driverEvent = results.find(e => e.name === driver);
        result[driver] = driverEvent ? driverEvent.RacePosition : null;
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
        baseScore: parseFloat(baseConsistencyScore.toFixed(1)) // Optional: Keep track of base score before DNF penalty
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
    history.forEach((event,i) => {
      const trackId = event.setup.TrackId;
      const track = NameMapper.fromTrackId(trackId, lists["tracks"]?.list);
      const weekId = history.length - i;

      if (!tracks[track]) {
        tracks[track] = { name: track, events: [] };
      }

      var resultsArray = raceResultsObject[event.stages?.race1?.id];
      tracks[track].events.push(...resultsArray);
      
      drivers.forEach((driver) => {
        if (driverBests[driver]) {
          var result = resultsArray.find(e => e.name === driver);
          if (!driverBests[driver][track] || result.RacePosition < driverBests[driver][track].RacePosition) {
            if( result ) result.RaceWeek = weekId;
            driverBests[driver][track] = result;
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
      
      const track = NameMapper.fromTrackId(events[0].setup.TrackId, lists["tracks"]?.list);
      const week = events[0].RaceWeek;
      
      drivers.forEach(driver => {
        // const driverEvent = events.find(e => e.PlayerName === driver);
        const weekRaceResults = Object.values(raceResultsObject).find((res) => {
          return res[0].RaceWeek === week
        })
        const weekQualiResults = Object.values(qualiResultsObject).find((res) => {
          return res[0].RaceWeek === week
        });

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
            delta: positionsDelta
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
            delta: positionsDelta
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
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
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
    <Container fluid className="performance-analytics p-0">
      <Row>
        <Col xs={12}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="m-0">Performance Analytics</h4>
            {
              !showHistorySpinner && 
              <Form.Select 
                value={selectedDriver} 
                onChange={handleDriverChange}
                style={{ width: 'auto' }}
              >
                {formattedData.drivers.map(driver => (
                  <option key={driver} value={driver}>{driver}</option>
                ))}
              </Form.Select>
            }
          </div>
          <Divider />
        </Col>
      </Row>

      {showHistorySpinner ?
        <div className="text-center mt-4">
            <Spinner animation="border" role="status"/>
            <div>
                This may take a moment...
            </div>
        </div>
        :
        <>
          {/* Main Content */}
          <Box sx={{ width: '100%'}}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Tabs 
                value={selectedTab} 
                onChange={handleTabChange} 
                aria-label="performance metrics tabs"
                variant="scrollable"
                scrollButtons="auto"
                TabIndicatorProps={{ style: { display: 'none' } }}
                sx={{
                  '& .MuiTabs-flexContainer': {
                    justifyContent: 'center',
                  },
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    minWidth: 120,
                    fontWeight: 500,
                    margin: '0 4px',
                    borderRadius: '20px',
                    transition: 'all 0.2s',
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                    }
                  }
                }}
              >
                <Tab label="Form Tracker" />
                <Tab label="Consistency Rating" />
                <Tab label="Peak Performance" />
                <Tab label="Comeback Factor" />
              </Tabs>
            </Box>
          </Box>

          <Box sx={{ width: '100%' }}>
            {/* Form Tracker Tab */}
            <PerformanceTabPanel value={selectedTab} index={0}>
              <Row>
                <Col lg={8}>
                  <StatsCard>
                    <StatsCardHeader>
                      <Typography variant="h6">Recent Form: {selectedDriver}</Typography>
                      <DriverBadge bg="primary">Last {selectedDriverFormData.length} Races Finished</DriverBadge>
                    </StatsCardHeader>
                    <div style={{ height: '400px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={selectedDriverFormData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            label={{ value: 'Race', position: 'insideBottomRight', offset: -10 }} 
                          />
                          <YAxis 
                            domain={[1, dataMax => Math.max(dataMax, 10)]} 
                            reversed 
                            label={{ value: 'Position', angle: -90, position: 'insideLeft' }} 
                          />
                        <Tooltip 
                          formatter={(value) => [`P${value}`, 'Position']}
                          labelFormatter={(label, payload) => {
                            if (payload && payload.length > 0) {
                              const dataPoint = payload[0].payload;
                              return `${label} - ${dataPoint.track}`;
                            }
                            return label;
                          }}
                          contentStyle={{ borderRadius: '4px' }}
                        />
                          <Legend content={renderCustomLegend} />
                          <ReferenceLine y={3.5} strokeDasharray="5 5" stroke="#4CAF50" />
                          <Line 
                            type="monotone" 
                            dataKey="position" 
                            name={selectedDriver} 
                            stroke="#8884d8" 
                            strokeWidth={3}
                            activeDot={{ r: 8 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </StatsCard>
                </Col>
                <Col lg={4}>
                  <StatsCard>
                    <StatsCardHeader>
                      <Typography variant="h6">Form Analysis</Typography>
                    </StatsCardHeader>
                    
                    {selectedDriverFormData.length > 0 ? (
                      <>
                        {/* Key Stats Section - Visual upgrade */}
                        <div className="key-stats-container p-2 mb-3" style={{background: 'rgba(0,0,0,0.02)', borderRadius: '8px'}}>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="text-center flex-grow-1">
                              <div className="stats-value" style={{fontSize: '1.5rem', fontWeight: '600'}}>
                                P{Math.min(...selectedDriverFormData.map(race => race.position))}
                              </div>
                              <div className="stats-label text-muted" style={{fontSize: '0.8rem'}}>Best Result</div>
                            </div>
                            <div className="text-center flex-grow-1">
                              <div className="stats-value" style={{fontSize: '1.5rem', fontWeight: '600'}}>
                                P{(selectedDriverFormData.reduce((sum, race) => sum + race.position, 0) / selectedDriverFormData.length).toFixed(1)}
                              </div>
                              <div className="stats-label text-muted" style={{fontSize: '0.8rem'}}>Average</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Performance Trend - Add proper spacing */}
                        <div className="stats-item mb-3 pb-3" style={{borderBottom: '1px solid rgba(0,0,0,0.08)'}}>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="stats-label" style={{marginRight: '12px', flexShrink: 0}}>Season Trend</span>
                            <span className="stats-value" style={{textAlign: 'right'}}>
                              {selectedDriverFormData.length >= 2 && 
                                (selectedDriverFormData[selectedDriverFormData.length - 1].position < 
                                selectedDriverFormData[0].position ? 
                                  <Badge bg="success" style={{padding: '0.4rem 0.8rem'}}>Improving</Badge> : 
                                    selectedDriverFormData[selectedDriverFormData.length - 1].position === 
                                    selectedDriverFormData[0].position ?
                                    <Badge bg="info" style={{padding: '0.4rem 0.8rem'}}>Steady</Badge> :
                                    <Badge bg="warning" text="dark" style={{padding: '0.4rem 0.8rem'}}>Declining</Badge>)
                              }
                            </span>
                          </div>
                        </div>
                        
                        {/* Recent Momentum - Better spacing */}
                        <div className="stats-item mb-3">
                          <span className="stats-label mb-2">Recent Momentum</span>
                          <div className="position-badges d-flex justify-content-center">
                            {selectedDriverFormData.slice(-3).map((race, idx) => (
                              <div key={idx} className="text-center mx-2">
                                <span 
                                  className={`position-badge ${race.position <= 3 ? 'podium' : 
                                              race.position <= 10 ? 'points' : 'outside-points'}`}
                                  style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center'}}
                                >
                                  P{race.position}
                                </span>
                                <div className="small text-muted mt-1" style={{fontSize: '0.7rem'}}>{race.track.split(' ')[0]}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Recent Races - Better visual separation */}
                        <div className="pt-3">
                          <span className="stats-label mb-2">
                            <i className="bi bi-flag me-1"></i> Recent Races
                          </span>
                          <div className="race-list">
                            {selectedDriverFormData.slice(-5).reverse().map((race, idx) => (
                              <div key={idx} className="race-item d-flex justify-content-between align-items-center py-2">
                                <span className="race-track d-flex align-items-center">
                                  <span className="race-number me-2" style={{
                                    width: '18px', 
                                    height: '18px', 
                                    borderRadius: '50%', 
                                    background: 'rgba(0,0,0,0.05)', 
                                    fontSize: '0.7rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    {idx+1}
                                  </span>
                                  <small>{race.track}</small>
                                </span>
                                <span className={`race-result ${race.position <= 3 ? 'podium' : race.position <= 10 ? 'points' : ''}`}>
                                  P{race.position}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted">No recent race data available</p>
                      </div>
                    )}
                  </StatsCard>
                </Col>
              </Row>
            </PerformanceTabPanel>

            {/* Consistency Rating Tab */}
            <PerformanceTabPanel value={selectedTab} index={1}>
              <Row>
                <Col md={6}>
                  <StatsCard>
                    <StatsCardHeader>
                      <Typography variant="h6">{selectedDriver} Consistency Profile</Typography>
                    </StatsCardHeader>
                    <div style={{ height: '400px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart outerRadius={150} width={500} height={500} data={[
                          { subject: 'Consistency', A: selectedDriverConsistency.consistency, fullMark: 10 },
                          { subject: 'Finish Rate', A: selectedDriverConsistency.finishRate, fullMark: 10 },
                          // { subject: 'Clean Racing', A: selectedDriverConsistency.cleanRacing, fullMark: 10 },
                          // { subject: 'Adaptability', A: Math.random() * 3 + 7, fullMark: 10 }, // Placeholder
                          { subject: 'Qualifying', A: selectedDriverConsistency.qualifyingPercentile / 10, fullMark: 10 }, // Placeholder
                        ]}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" />
                          <PolarRadiusAxis angle={90} domain={[0, 10]} />
                          <Radar name={selectedDriver} dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </StatsCard>
                </Col>
                <Col md={6}>
                  <Row>
                    <Col xs={12}>
                      <StatsCard sx={{ mb: 3 }}>
                        <StatsCardHeader>
                          <Typography variant="h6">Consistency Rating</Typography>
                        </StatsCardHeader>
                        <div className="consistency-score-container">
                          <div className="score-circle" style={{ 
                            background: `conic-gradient(
                              ${getConsistencyColor(selectedDriverConsistency.consistency)} 
                              ${selectedDriverConsistency.consistency * 10}%, 
                              #e0e0e0 0
                            )`
                          }}>
                            <div className="score-inner">
                              <span>{selectedDriverConsistency.consistency}</span>
                              <small>/10</small>
                            </div>
                          </div>
                          <div className="score-explanation">
                            <Typography variant="subtitle1" className="mb-2">
                              {getConsistencyRating(selectedDriverConsistency.consistency)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Based on position variance across {selectedDriverConsistency.races || 0} races.
                              A higher score indicates more consistent finishing positions.
                            </Typography>
                          </div>
                        </div>
                      </StatsCard>
                    </Col>
                    <Col xs={12}>
                      <StatsCard>
                        <StatsCardHeader>
                          <Typography variant="h6">Performance Stats</Typography>
                        </StatsCardHeader>
                        <Table bordered hover size="sm" className="mb-0">
                          <tbody>
                            <tr>
                              <td>Average Position</td>
                              <td className="text-end">
                                <strong>P{selectedDriverConsistency.avgPosition || 0}</strong>
                              </td>
                            </tr>
                            <tr>
                              <td>Finish Rate</td>
                              <td className="text-end">
                                <strong>
                                  {(selectedDriverConsistency.finishRate / 10 * 100).toFixed(1)}%
                                </strong>
                              </td>
                            </tr>
                            <tr>
                              <td>Average Qualifying</td>
                              <td className="text-end">
                                <strong>
                                  P{selectedDriverConsistency.qualifying || 0}
                                </strong>
                              </td>
                            </tr>
                            <tr>
                              <td>Average Qualifying Percentile</td>
                              <td className="text-end">
                                <strong>
                                  {(selectedDriverConsistency.qualifyingPercentile)?.toFixed(1)}%
                                </strong>
                              </td>
                            </tr>
                            {/* <tr>
                              <td>Clean Racing Score</td>
                              <td className="text-end">
                                <Badge bg={getCleanRacingColor(selectedDriverConsistency.cleanRacing)}>
                                  {selectedDriverConsistency.cleanRacing}/10
                                </Badge>
                              </td>
                            </tr>
                            <tr>
                              <td>Total Incidents</td>
                              <td className="text-end">
                                <strong>{selectedDriverConsistency.incidents || 0}</strong>
                              </td>
                            </tr>
                            <tr>
                              <td>Incidents per Race</td>
                              <td className="text-end">
                                <strong>
                                  {selectedDriverConsistency.races ? 
                                    (selectedDriverConsistency.incidents / selectedDriverConsistency.races).toFixed(1) : 
                                    '0.0'}
                                </strong>
                              </td>
                            </tr> */}
                          </tbody>
                        </Table>
                      </StatsCard>
                    </Col>
                  </Row>
                </Col>
              </Row>
              <Row className="mt-4">
                <Col xs={12}>
                  <StatsCard>
                    <StatsCardHeader>
                      <Typography variant="h6">League Consistency Rankings</Typography>
                    </StatsCardHeader>
                    <div style={{ height: '600px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={formattedData.consistencyRatings.sort((a, b) => b.consistency - a.consistency)}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                          barSize={20}
                          barGap={8}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 10]} />
                          <YAxis dataKey="name" type="category" width={150} interval={0} />
                          <Tooltip formatter={(value) => [`${value}/10`, 'Consistency']} />
                          <Legend />
                          <Bar 
                            dataKey="consistency" 
                            name="Consistency Rating" 
                            fill="#8884d8" 
                            radius={[0, 4, 4, 0]}
                          >
                            {formattedData.consistencyRatings
                              .sort((a, b) => b.consistency - a.consistency)
                              .map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={entry.name === selectedDriver ? '#ff7300' : '#8884d8'} 
                                />
                              ))
                            }
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </StatsCard>
                </Col>
              </Row>
            </PerformanceTabPanel>

            {/* Peak Performance Tab */}
            <PerformanceTabPanel value={selectedTab} index={2}>
              <Row>
                <Col lg={8}>
                  <StatsCard>
                    <StatsCardHeader>
                      <Typography variant="h6">{selectedDriver} Peak Performances</Typography>
                    </StatsCardHeader>
                    <div className="track-performances">
                      <Table hover responsive className="mb-0">
                        <thead>
                          <tr>
                            <th>Track</th>
                            <th className="text-center">Best Finish</th>
                            <th className="text-center">Date</th>
                            <th className="text-end">Qualifying</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formattedData.peakPerformances.tracks && formattedData.peakPerformances.tracks.map((track, idx) => {
                            const bestPerformance = formattedData.peakPerformances.driverBests[selectedDriver]?.[track.name];
                            if (!bestPerformance) return null;
                            
                            return (
                              <tr key={idx}>
                                <td>{track.name}</td>
                                <td className="text-center">
                                  <span className={`position-highlight ${bestPerformance.RacePosition <= 3 ? 'podium' : 
                                                bestPerformance.RacePosition <= 10 ? 'points' : ''}`}>
                                    P{bestPerformance.RacePosition}
                                  </span>
                                </td>
                                <td className="text-center">Week {bestPerformance.RaceWeek}</td>
                                <td className="text-end">
                                  P{bestPerformance.QualifyingPosition || '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>
                  </StatsCard>
                </Col>
                <Col lg={4}>
                  <StatsCard>
                    <StatsCardHeader>
                      <Typography variant="h6">Specialist Tracks</Typography>
                    </StatsCardHeader>
                    <div className="specialist-tracks">
                      {formattedData.peakPerformances.tracks && 
                      formattedData.peakPerformances.driverBests[selectedDriver] && 
                      Object.entries(formattedData.peakPerformances.driverBests[selectedDriver])
                        .filter(([track,performance]) => performance !== undefined)
                        .sort((a, b) => a[1].RacePosition - b[1].RacePosition)
                        .slice(0, 3)
                        .map(([track, performance], idx) => (
                          <div key={idx} className="track-card mb-2">
                            <div className="track-position">P{performance?.RacePosition}</div>
                            <div className="track-details">
                              <div className="track-name">{track}</div>
                              <div className="track-stats">Week {performance?.RaceWeek}</div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </StatsCard>
                </Col>
              </Row>
              <Row className="mt-3">
                <Col xs={12}>
                  <StatsCard>
                    <StatsCardHeader>
                      <Typography variant="h6">Performance Distribution</Typography>
                    </StatsCardHeader>
                    <div className="performance-distribution d-flex justify-content-center align-items-end" 
                        style={{ padding: '20px 10px 10px' }}>
                      {calculatePositionDistribution(formattedData.peakPerformances, selectedDriver).map((count, position) => {
                        const barHeight = count > 0 ? Math.max(count * 25, 30) : 0;
                        const showCountInside = barHeight > 40;
                        
                        return (
                          <div key={position} className="d-flex flex-column align-items-center" style={{ width: '40px' }}>
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
                                className={`position-bar ${position < 3 ? 'podium' : position < 10 ? 'points' : ''}`}
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
                  </StatsCard>
                </Col>
              </Row>
            </PerformanceTabPanel>

            {/* Comeback Factor Tab */}
            <PerformanceTabPanel value={selectedTab} index={3}>
              <Row>
                <Col md={6}>
                  <StatsCard>
                    <StatsCardHeader>
                      <Typography variant="h6">Comeback Factor: {selectedDriver}</Typography>
                    </StatsCardHeader>
                    <div className="comeback-factor mt-3">
                      <div className="d-flex justify-content-center align-items-center mb-4">
                        <div className="comeback-score-container">
                          {formattedData.comebackFactors.driverComebacks && 
                            formattedData.comebackFactors.driverComebacks
                              .find(d => d.name === selectedDriver)?.value > 0 ? (
                            <div className="comeback-score positive">
                              <span>+{formattedData.comebackFactors.driverComebacks.find(d => d.name === selectedDriver)?.value || 0}</span>
                              <small>positions</small>
                            </div>
                          ) : (
                            <div className="comeback-score negative">
                              <span>{formattedData.comebackFactors.driverComebacks?.find(d => d.name === selectedDriver)?.value || 0}</span>
                              <small>positions</small>
                            </div>
                          )}
                        </div>
                        <div className="comeback-explanation ms-3">
                          <Typography variant="body1">
                            {getComebackRating(formattedData.comebackFactors.driverComebacks?.find(d => d.name === selectedDriver)?.value || 0)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Average positions gained from qualifying to finish
                          </Typography>
                        </div>
                      </div>
                      
                      <div>
                        <Typography variant="subtitle2" className="mb-2">Race-by-Race Comebacks</Typography>
                        <div style={{ height: '300px', width: '100%' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={selectedDriverComebacks}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="track" />
                              <YAxis label={{ value: 'Positions Gained/Lost', angle: -90, position: 'insideLeft' }} />
                              <Tooltip 
                                formatter={(value) => [`${value > 0 ? '+' : ''}${value} positions`, 'Change']}
                                labelFormatter={(label) => `${label}`} 
                              />
                              <ReferenceLine y={0} stroke="#000" />
                              <Bar 
                                dataKey="delta" 
                                name="Positions Gained" 
                                fill={(data) => data.delta > 0 ? "#4CAF50" : "#FF5722"}
                              >
                                {selectedDriverComebacks.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.delta > 0 ? "#4CAF50" : "#FF5722"} 
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </StatsCard>
                </Col>
                <Col md={6}>
                  <Row>
                    <Col xs={12}>
                      <StatsCard sx={{ mb: 3 }}>
                        <StatsCardHeader>
                          <Typography variant="h6">Best Comeback</Typography>
                        </StatsCardHeader>
                        <div className="best-comeback">
                          {formattedData.comebackFactors.driverComebacks && 
                          formattedData.comebackFactors.driverComebacks.find(d => d.name === selectedDriver)?.bestComeback?.delta > 0 ? (
                            <div className="d-flex align-items-center">
                              <div className="comeback-highlight">
                                <span className="positions-gained">
                                  +{formattedData.comebackFactors.driverComebacks.find(d => d.name === selectedDriver)?.bestComeback?.delta || 0}
                                </span>
                              </div>
                              <div className="comeback-details ms-3">
                                <div className="track-name">
                                  {formattedData.comebackFactors.driverComebacks.find(d => d.name === selectedDriver)?.bestComeback?.track}
                                </div>
                                <div className="position-change">
                                  <span className="text-muted me-1">From</span>
                                  <span className="qualifying-position">P{formattedData.comebackFactors.driverComebacks.find(d => d.name === selectedDriver)?.bestComeback?.qualifying}</span>
                                  <span className="text-muted mx-1">to</span>
                                  <span className="finish-position">P{formattedData.comebackFactors.driverComebacks.find(d => d.name === selectedDriver)?.bestComeback?.finish}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-3">
                              <Typography variant="body1" color="text.secondary">No notable comebacks recorded</Typography>
                            </div>
                          )}
                        </div>
                      </StatsCard>
                    </Col>
                    <Col xs={12}>
                      <StatsCard>
                        <StatsCardHeader>
                          <Typography variant="h6">League Comeback Rankings</Typography>
                        </StatsCardHeader>
                        <div style={{ height: '280px', width: '100%' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={formattedData.comebackFactors.driverComebacks?.sort((a, b) => b.value - a.value)}
                              layout="vertical"
                              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis dataKey="name" type="category" width={100} />
                              <Tooltip formatter={(value) => [`${value > 0 ? '+' : ''}${value} positions`, 'Avg Gained/Lost']} />
                              <Bar dataKey="value" name="Comeback Factor" radius={[0, 4, 4, 0]}>
                                {formattedData.comebackFactors.driverComebacks?.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.name === selectedDriver ? '#ff7300' : 
                                          entry.value > 0 ? '#4CAF50' : '#FF5722'} 
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </StatsCard>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </PerformanceTabPanel>
          </Box>
        </>
      }
    </Container>
  );
};

// Helper function to get color based on consistency score
const getConsistencyColor = (score) => {
  if (score >= 8) return '#4CAF50';  // Green
  if (score >= 6) return '#2196F3';  // Blue
  if (score >= 4) return '#FF9800';  // Orange
  return '#F44336';  // Red
};

// Helper function to get rating text based on consistency score
const getConsistencyRating = (score) => {
  if (score >= 8.5) return 'Exceptional Consistency';
  if (score >= 7) return 'Very Consistent';
  if (score >= 5.5) return 'Consistent';
  if (score >= 4) return 'Somewhat Inconsistent';
  return 'Inconsistent';
};

// Helper function to get color for clean racing score
// const getCleanRacingColor = (score) => {
//   if (score >= 8) return 'success';
//   if (score >= 6) return 'primary';
//   if (score >= 4) return 'warning';
//   return 'danger';
// };

// Helper function to get comeback rating
const getComebackRating = (score) => {
  if (score > 3) return 'Elite Overtaker';
  if (score > 1.5) return 'Strong Race Pace';
  if (score > 0) return 'Gains Positions';
  if (score > -1.5) return 'Maintains Position';
  return 'Struggles in Race';
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
