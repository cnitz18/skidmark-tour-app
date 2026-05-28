import { useEffect, useState } from "react";
import { Modal, Button, Spinner, Nav, Tab, Badge, Card } from 'react-bootstrap';
import { Table, TableContainer, Paper } from "@mui/material";
import msToTime from "../../utils/msToTime";
import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot } from 'recharts';
import SessionHistoryHeadToHeadComparison from './SessionHistoryHeadToHeadComparison';
import ConsistencyTracker from './ConsistencyTracker';
// eslint-disable-next-line no-unused-vars
import "./SessionHistoryEntryScoreboard.css";
import { RaceAnalyticsProvider } from "../../utils/RaceAnalyticsContext";
import getStandardizedEventData from "../../utils/getStandardizedEventData";
import detectPitStops from "../../utils/detectPitStops";

const SessionHistoryEntryScoreboard = ({ race, vehicles, winner, session, multiclass, isHistorical }) => {
  const [showModal, setShowModal] = useState(false);
  const [eventsData, setEventsData] = useState([]);
  const [selectedRacerName, setSelectedRacerName] = useState("");
  const [participantsMap, setParticipantsMap] = useState({});
  const [showSpinner, setShowSpinner] = useState(true);
  const [minSectors, setMinSectors] = useState({});
  const [activeTab, setActiveTab] = useState("lapLog");
  const [showLapChart, setShowLapChart] = useState(false);
  const [allPlayerEvents, setAllPlayerEvents] = useState([]);
  const [selectedParticipantId,setSelectedParticipantId] = useState(null);
  const [freshEventsData, setFreshEventsData] = useState([]);

  const handleCloseModal = () => {
    setEventsData([]);
    setAllPlayerEvents([])
    setFreshEventsData([]);
    setMinSectors({});
    setShowModal(false)
  };
  const handleShowModal = () => setShowModal(true);

  function rowClick(res){
    let stage_id = res["stage"]
    let participant_id = res["participantid"]
    setShowSpinner(true);
    setActiveTab("lapLog");
    setShowLapChart(false);
    setEventsData([]);
    setAllPlayerEvents([]);
    setFreshEventsData([]);
    setMinSectors({});
    setSelectedRacerName(res["name"])

    var promiseArr = [], playerEvents = [];;
    race.results.forEach((racer) => {
      promiseArr.push(
        getStandardizedEventData(stage_id, racer.participantid)
        .then((res) => {
          // Store fresh, unprocessed data for accurate pit detection
          if( racer.participantid === participant_id ){
            setFreshEventsData(res);
          }
          
          var lapTracker = 1;
          res = res.map((evt) => {
            if( evt.event_name === "Lap" ){
              // Lap events start at 0
              // evt.attributes_Lap = evt.attributes_Lap + 1
              lapTracker = evt.attributes_Lap + 1;
            }
            else if( evt.attributes_Lap ){
              lapTracker = evt.attributes_Lap;
            }
            else{
              evt.attributes_Lap = lapTracker;
            }
            return evt;
          });
          playerEvents.push(res);
          if( racer.participantid === participant_id ){
            setSelectedParticipantId(racer.participantid);
            setEventsData(res);
          }
        })
      );
      
    })
    
    Promise.all(promiseArr)
      .then(() =>setAllPlayerEvents(playerEvents) )
      .finally(() => setShowSpinner(false));
    handleShowModal()
  }

  function getEventDescription( evt ){
    switch( evt.event_name ){
      case 'Impact': 
        let player_name = evt.attributes_OtherParticipantId === -1 ? "the wall" : (participantsMap[evt.attributes_OtherParticipantId] ?? "<unnamed driver>")
        return `Contact with ${player_name} (magnitude ${evt.attributes_CollisionMagnitude})`
      case 'CutTrackStart':
        return `Lap ${evt.attributes_Lap} (+${msToTime(evt.attributes_LapTime)}), Running P${evt.attributes_RacePosition}`;
      case 'CutTrackEnd':
        let str = `Elapsed time: ${msToTime(evt.attributes_ElapsedTime)}, Gained ${evt.attributes_PlaceGain} Positions, ${evt.attributes_PenaltyValue ? "" : "No"} Penalty Applied`;
        if( evt.attributes_PlaceGain > 0 )
          str += ". Naughty naughty!!"
        return str;
      case 'State':
        return `Now ${evt.attributes_NewState.replace(/([A-Z])/g, ' $1').trim()}`;
      case 'Lap':
        return `Lap ${evt.attributes_Lap} complete - Time: ${msToTime(evt.attributes_LapTime)}`;
      default:
        return "Uh oh - no output generated for this event type";
    }
  }

  const formatLapDataForChart = () => {
    const lapEvents = eventsData
      .filter((evt) => evt.event_name === "Lap")
      .sort((a, b) => a.attributes_Lap - b.attributes_Lap);

    if (!lapEvents.length) return { data: [], pitLaps: { in: [], out: [] }, bestLap: null };

    // Use fresh (unprocessed) data for pit detection to avoid lap tracker corruption
    const pitLaps = freshEventsData.length > 0
      ? detectPitStops(freshEventsData, freshEventsData.filter(evt => evt.event_name === "Lap").sort((a, b) => a.attributes_Lap - b.attributes_Lap))
      : detectPitStops(eventsData, lapEvents);
    const bestLapEvent = lapEvents.reduce(
      (best, current) => (current.attributes_LapTime < best.attributes_LapTime ? current : best),
      lapEvents[0]
    );

    const data = lapEvents.map((lap) => ({
      lap: lap.attributes_Lap,
      lapTime: lap.attributes_LapTime / 1000,
    }));

    return {
      data,
      pitLaps,
      bestLap: {
        lap: bestLapEvent.attributes_Lap,
        lapTime: bestLapEvent.attributes_LapTime / 1000,
      },
    };
  };

  const lapChartData = formatLapDataForChart();

  const lapTimeDomain = (() => {
    if (!lapChartData.data.length) return ['auto', 'auto'];

    const lapTimes = lapChartData.data.map((point) => point.lapTime);
    const minLapTime = Math.min(...lapTimes);
    const maxLapTime = Math.max(...lapTimes);
    const range = Math.max(maxLapTime - minLapTime, 0.1);
    const padding = Math.max(range * 0.1, 0.2);

    return [Math.max(0, minLapTime - padding), maxLapTime + padding];
  })();

  const LapChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="lap-mini-tooltip">
          <div className="lap-mini-tooltip-title">Lap {label}</div>
          <div className="lap-mini-tooltip-row">
            <span>Lap Time</span>
            <strong>{msToTime(payload[0].value * 1000)}</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  const getEventBadge = (eventName) => {
    switch(eventName) {
      case 'Impact':
        return <Badge bg="danger">Contact</Badge>;
      case 'CutTrackStart':
        return <Badge bg="warning" text="dark">Off-Track Start</Badge>;
      case 'CutTrackEnd':
        return <Badge bg="warning" text="dark">Off-Track End</Badge>;
      case 'State':
        return <Badge bg="info" text="dark">State Change</Badge>;
      default:
        return <Badge bg="secondary">{eventName}</Badge>;
    }
  };

  useEffect(() => {
    if( race?.results?.length ){
      let participants = {};
      for( let i=0; i < race.results.length; i++ )
        participants[race.results[i].participantid] = race.results[i].name;
      setParticipantsMap(participants)
    }
  }, [race,selectedRacerName]);

  const getLapIntelligence = () => {
    const lapEvents = eventsData
      .filter((evt) => evt.event_name === "Lap")
      .sort((a, b) => a.attributes_Lap - b.attributes_Lap);

    if (!lapEvents.length) {
      return {
        idealLapTime: null,
        bestLapTime: null,
        potentialGain: null,
        insights: []
      };
    }

    const bestLapTime = minSectors.total ?? Math.min(...lapEvents.map((lap) => lap.attributes_LapTime));
    const hasSectorData = minSectors.sector1 && minSectors.sector2 && minSectors.sector3;
    const idealLapTime = hasSectorData ? (minSectors.sector1 + minSectors.sector2 + minSectors.sector3) : null;
    const potentialGain = idealLapTime ? Math.max(0, bestLapTime - idealLapTime) : null;

    const avgS1 = lapEvents.reduce((sum, lap) => sum + lap.attributes_Sector1Time, 0) / lapEvents.length;
    const avgS2 = lapEvents.reduce((sum, lap) => sum + lap.attributes_Sector2Time, 0) / lapEvents.length;
    const avgS3 = lapEvents.reduce((sum, lap) => sum + lap.attributes_Sector3Time, 0) / lapEvents.length;

    const sectorLosses = [
      { sector: 'S1', loss: avgS1 - minSectors.sector1 },
      { sector: 'S2', loss: avgS2 - minSectors.sector2 },
      { sector: 'S3', loss: avgS3 - minSectors.sector3 },
    ].sort((a, b) => b.loss - a.loss);

    const biggestLeak = sectorLosses[0];

    let bestWindow = null;
    const windowSize = lapEvents.length >= 5 ? 5 : (lapEvents.length >= 3 ? 3 : 0);
    if (windowSize > 0) {
      let bestAvg = Number.POSITIVE_INFINITY;
      let bestStart = 0;

      for (let i = 0; i <= lapEvents.length - windowSize; i++) {
        const laps = lapEvents.slice(i, i + windowSize);
        const avg = laps.reduce((sum, lap) => sum + lap.attributes_LapTime, 0) / windowSize;
        if (avg < bestAvg) {
          bestAvg = avg;
          bestStart = laps[0].attributes_Lap;
        }
      }

      bestWindow = {
        size: windowSize,
        startLap: bestStart,
        endLap: bestStart + windowSize - 1,
        average: bestAvg,
      };
    }

    let biggestDrop = null;
    for (let i = 1; i < lapEvents.length; i++) {
      const delta = lapEvents[i].attributes_LapTime - lapEvents[i - 1].attributes_LapTime;
      if (delta <= 0) continue;
      if (!biggestDrop || delta > biggestDrop.delta) {
        biggestDrop = {
          lapFrom: lapEvents[i - 1].attributes_Lap,
          lapTo: lapEvents[i].attributes_Lap,
          delta,
        };
      }
    }

    const insights = [];
    if (biggestLeak && biggestLeak.loss > 0) {
      insights.push({
        title: 'Largest Time Leak',
        value: `${biggestLeak.sector} +${msToTime(biggestLeak.loss)}`,
        detail: `Average ${biggestLeak.sector} is ${msToTime(biggestLeak.loss)} slower than your ${biggestLeak.sector} best.`,
      });
    }

    if (bestWindow) {
      insights.push({
        title: 'Best Repeatable Pace',
        value: `${bestWindow.size}-lap avg ${msToTime(bestWindow.average)}`,
        detail: `Lap ${bestWindow.startLap} to ${bestWindow.endLap}`,
      });
    }

    if (biggestDrop) {
      insights.push({
        title: 'Largest Pace Drop',
        value: `+${msToTime(biggestDrop.delta)}`,
        detail: `From lap ${biggestDrop.lapFrom} to lap ${biggestDrop.lapTo}`,
      });
    }

    return { idealLapTime, bestLapTime, potentialGain, insights };
  };

  const lapIntelligence = getLapIntelligence();

  useEffect(() => {
    if( eventsData.length ){
      var bestHighlightedData = [...eventsData].filter(e => e.event_name==="Lap");
      const sector1 = bestHighlightedData.reduce((accumulator, currentValue) => {
        return Math.min(accumulator,currentValue.attributes_Sector1Time);
      },bestHighlightedData[0]?.attributes_Sector1Time)
      const sector2 = bestHighlightedData.reduce((accumulator, currentValue) => {
        return Math.min(accumulator,currentValue.attributes_Sector2Time);
      },bestHighlightedData[0]?.attributes_Sector2Time)
      const sector3 = bestHighlightedData.reduce((accumulator, currentValue) => {
        return Math.min(accumulator,currentValue.attributes_Sector3Time);
      },bestHighlightedData[0]?.attributes_Sector3Time)
      const total = bestHighlightedData.reduce((accumulator, currentValue) => {
        return Math.min(accumulator,currentValue.attributes_LapTime);
      },bestHighlightedData[0]?.attributes_LapTime)
      setMinSectors({sector1,sector2,sector3,total})
    }
  },[eventsData])
  return (  
    <>
      <RaceAnalyticsProvider raceData={race} eventsData={allPlayerEvents}>

        <Modal show={showModal} onHide={handleCloseModal} size="xl" className="race-event-modal">
          <Modal.Header closeButton className="border-bottom-0 pb-0">
            <Modal.Title className="d-flex align-items-center">
              <span className="fs-4">{session} Details</span>
              <span className="badge bg-primary ms-3 fs-6">{selectedRacerName}</span>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-2">
            {showSpinner ? (
              <div className="text-center my-5 py-5">
                <Spinner animation="border" role="status" variant="primary"/>
                <div className="mt-3 text-muted">
                  Loading event data...
                </div>
              </div>
            ) : eventsData && eventsData.length > 0 ? (
              <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                <Nav variant="pills" className="mb-3 race-detail-pills">
                  <Nav.Item>
                    <Nav.Link eventKey="lapLog" className="d-flex align-items-center justify-content-center">
                      <i className="bi bi-stopwatch me-2"></i>
                      Lap Times
                    </Nav.Link>
                  </Nav.Item>
                  { session === "Race" && (
                    <Nav.Item>
                      <Nav.Link eventKey="headToHead" className="d-flex align-items-center justify-content-center">
                        <i className="bi bi-people me-2"></i>
                        Driver Comparison
                      </Nav.Link>
                    </Nav.Item>
                  )}
                  <Nav.Item>
                    <Nav.Link eventKey="events" className="d-flex align-items-center justify-content-center">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {session} Timeline
                    </Nav.Link>
                  </Nav.Item>
                  { session === "Race" && (
                    <Nav.Item>
                      <Nav.Link eventKey="performanceInsights" className="d-flex align-items-center justify-content-center">
                        <i className="bi bi-lightning-charge me-2"></i>
                        Performance Insights
                      </Nav.Link>
                    </Nav.Item>
                  )}
                </Nav>
                
                <Tab.Content>
                  <Tab.Pane eventKey="lapLog">
                    {activeTab === "lapLog" && (
                      <Paper elevation={0} className="p-3 mb-4 border">
                        <div className="lap-intelligence-panel mb-3">
                          <div className="lap-intelligence-summary">
                            <div className="summary-item">
                              <span className="summary-label">Fastest Lap</span>
                              <span className="summary-value">
                                {lapIntelligence.bestLapTime ? msToTime(lapIntelligence.bestLapTime) : 'N/A'}
                              </span>
                            </div>
                            <div className="summary-item">
                              <span className="summary-label">Ideal Lap</span>
                              <span className="summary-value">
                                {lapIntelligence.idealLapTime ? msToTime(lapIntelligence.idealLapTime) : 'N/A'}
                              </span>
                            </div>
                            <div className="summary-item">
                              <span className="summary-label">Potential Gain</span>
                              <span className="summary-value summary-gain">
                                {lapIntelligence.potentialGain ? `-${msToTime(lapIntelligence.potentialGain)}` : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex flex-row justify-content-end align-items-center mb-3">
                          <div className="legend-container">
                            <span className="personal-fastest-lap-legend me-3">
                              <span className="color-box"></span> Best Lap
                            </span>
                            <span className="personal-fastest-sector-legend">
                              <span className="color-box"></span> Best Sector
                            </span>
                          </div>
                        </div>
                        
                        <div className="lap-time-table mt-3">
                          <Table>
                            <thead>
                              <tr>
                                <th className="text-center">#</th>
                                <th>Time</th>
                                <th>S1</th>
                                <th>S2</th>
                                <th>S3</th>
                                <th className="text-center">Pos</th>
                              </tr>
                            </thead>
                            <tbody>  
                              {
                                eventsData.filter(evt => evt.event_name === "Lap").map((evt, i) => (
                                  <tr key={i} className={i % 2 === 0 ? "even-row" : ""}>
                                    <td className="text-center">{i+1}</td>                            
                                    <td className={evt.attributes_LapTime === minSectors.total ? "personal-fastest-lap-highlight" : ""}>
                                      <span className="lap-time-value">{msToTime(evt.attributes_LapTime)}</span>
                                    </td>
                                    <td className={evt.attributes_Sector1Time === minSectors.sector1 ? "personal-fastest-sector-highlight" : ""}>
                                      <span className="sector-time-value">{msToTime(evt.attributes_Sector1Time)}</span>
                                    </td>
                                    <td className={evt.attributes_Sector2Time === minSectors.sector2 ? "personal-fastest-sector-highlight" : ""}>
                                      <span className="sector-time-value">{msToTime(evt.attributes_Sector2Time)}</span>
                                    </td>
                                    <td className={evt.attributes_Sector3Time === minSectors.sector3 ? "personal-fastest-sector-highlight" : ""}>
                                      <span className="sector-time-value">{msToTime(evt.attributes_Sector3Time)}</span>
                                    </td>
                                    <td className="text-center position-cell">
                                      <span className={`position-badge ${evt.attributes_RacePosition <= 3 ? `position-${evt.attributes_RacePosition}` : ''}`}>P{evt.attributes_RacePosition}</span>
                                    </td>
                                  </tr>
                                ))
                              }
                            </tbody>
                          </Table>
                        </div>

                        {lapIntelligence.insights.length > 0 && (
                          <div className="lap-intelligence-insights mb-3">
                            {lapIntelligence.insights.map((insight) => (
                              <div key={insight.title} className="insight-chip">
                                <div className="insight-chip-title">{insight.title}</div>
                                <div className="insight-chip-value">{insight.value}</div>
                                <div className="insight-chip-detail">{insight.detail}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="lap-table-toggle-wrap">
                          <Button
                            size="sm"
                            variant={showLapChart ? "outline-secondary" : "outline-primary"}
                            onClick={() => setShowLapChart((prev) => !prev)}
                          >
                            {showLapChart ? "Hide Lap Time Chart" : "Show Lap Time Chart"}
                          </Button>
                        </div>

                        {showLapChart && (
                          <div className="lap-mini-chart mt-3">
                            <h6 className="mb-2">Lap Time Progression</h6>
                            <div className="lap-mini-chart-canvas">
                              <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={lapChartData.data} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                  <XAxis dataKey="lap" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                                  <YAxis
                                    tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                                    width={48}
                                    domain={lapTimeDomain}
                                  />
                                  <Tooltip content={<LapChartTooltip />} />
                                  {lapChartData.pitLaps.in.map((lapNum) => {
                                    const lapData = lapChartData.data.find(d => d.lap === lapNum);
                                    return lapData ? (
                                      <ReferenceDot
                                        key={`pit-in-${lapNum}`}
                                        x={lapNum}
                                        y={lapData.lapTime}
                                        r={5}
                                        fill="#ff4444"
                                        stroke="#cc0000"
                                        ifOverflow="visible"
                                      />
                                    ) : null;
                                  })}
                                  {lapChartData.pitLaps.out.map((lapNum) => {
                                    const lapData = lapChartData.data.find(d => d.lap === lapNum);
                                    return lapData ? (
                                      <ReferenceDot
                                        key={`pit-out-${lapNum}`}
                                        x={lapNum}
                                        y={lapData.lapTime}
                                        r={5}
                                        fill="#ffaa00"
                                        stroke="#ff8800"
                                        ifOverflow="visible"
                                      />
                                    ) : null;
                                  })}
                                  {lapChartData.bestLap && (
                                    <ReferenceDot
                                      x={lapChartData.bestLap.lap}
                                      y={lapChartData.bestLap.lapTime}
                                      r={5}
                                      fill="#28a745"
                                      stroke="#1e7e34"
                                      ifOverflow="visible"
                                    />
                                  )}
                                  <Line type="monotone" dataKey="lapTime" stroke="#00a8e1" strokeWidth={2} dot={false} name="Lap Time" />
                                </ComposedChart>
                              </ResponsiveContainer>
                            </div>
                            <small className="text-muted">Green = fastest lap. Red = pit-in. Orange = pit-out.</small>
                          </div>
                        )}
                      </Paper>
                    )}
                  </Tab.Pane>
                  
                  <Tab.Pane eventKey="headToHead">
                    <Paper elevation={0} className="p-3 mb-4 border">
                      {activeTab === "headToHead" && (
                        <SessionHistoryHeadToHeadComparison 
                          eventsData={eventsData}
                          race={race}
                          session={session}
                          selectedDriver={{
                            name: selectedRacerName,
                            participantid: race.results.find(r => r.name === selectedRacerName)?.participantid,
                            stage: race.results.find(r => r.name === selectedRacerName)?.stage,
                            RacePosition: race.results.find(r => r.name === selectedRacerName)?.RacePosition,
                            FastestLapTime: race.results.find(r => r.name === selectedRacerName)?.FastestLapTime
                          }}
                        />
                      )}
                    </Paper>
                  </Tab.Pane>
                  
                  {/* Race Events tab pane */}
                  <Tab.Pane eventKey="events">
                    {activeTab === "events" && (
                      <Paper elevation={0} className="p-3 mb-4 border">
                        <h5 className="mb-3">{session} Timeline</h5>
                        <div className="events-container">
                          {eventsData.map((evt, i) => (
                            <Card key={i} className="event-card mb-2">
                              <Card.Body>
                                <div className="d-flex align-items-center">
                                  <div className="event-time me-3">
                                    Lap {evt.attributes_Lap}
                                  </div>
                                  {evt.event_name !== "Lap" && (
                                    <div className="event-badge me-3">
                                      {getEventBadge(evt.event_name)}
                                    </div>
                                  )}
                                  <div className="event-description">
                                    {getEventDescription(evt)}
                                  </div>
                                </div>
                              </Card.Body>
                            </Card>
                          ))}
                          {eventsData.filter(evt => evt.event_name !== 'Lap').length === 0 && (
                            <div className="text-center py-4 text-muted">
                              No events recorded for this session
                            </div>
                          )}
                        </div>
                      </Paper>
                    )}
                  </Tab.Pane>
                  
                  <Tab.Pane eventKey="performanceInsights">
                    {activeTab === "performanceInsights" && (
                      <div className="p-3">
                        <ConsistencyTracker eventsData={eventsData} selectedParticipantId={selectedParticipantId}/>
                      </div>
                    )}
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>
            ) : (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-calendar-x fs-1 d-block mb-2"></i>
                No event data found for this session
              </div>
            )}
            
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
        
        <TableContainer className="lap-time-table">
          <Table className="session-score">
            <thead>
              <tr>
                <th>
                  <span className="d-none d-md-inline">Finish Position</span>
                  <span className="d-md-none">#</span>
                </th>
                <th>Name</th>
                <th className="d-none d-md-table-cell">Vehicle</th>
                {
                  session.toLowerCase() === "race" ?
                  <th>Time</th> : <></>
                }
                <th className={session.toLowerCase() === "race" ? "d-none d-md-table-cell" : ""}>Fastest Lap</th>
                  {
                    session.toLowerCase() === "qualifying" ?
                    <th className="d-none d-md-table-cell">Delta</th> : <></>
                  }
                <th>
                </th>
              </tr>
            </thead>
            <tbody>
              {race && race.results && race.results.length ? (
                race.results.sort((a,b) => a.RacePosition - b.RacePosition).map((res, i) => {
                  return (
                    <tr key={i}>
                      <td>{res.RacePosition}</td>
                      <td>{res.name}</td>
                      <td className="d-none d-md-table-cell">{vehicles.find((v) => v.id === res.VehicleId)?.name}</td>
                      {
                        session.toLowerCase() === "race" 
                          ?
                        <td>
                          { 
                            res.TotalTime < winner.TotalTime || winner.Lap > res.Lap ?
                            "+ " + (winner.Lap - res.Lap) + " lap" + (winner.Lap - res.Lap > 1 ? "s" : "")
                            :
                            (
                              (i && winner.TotalTime) 
                              ? 
                              "+"+ msToTime(res.TotalTime - winner.TotalTime) 
                              : 
                                msToTime(res.TotalTime)
                            )
                          }
                        </td>
                        : <></>
                      }
                      <td className={`${res.IsFastestLap ? "race-fastest-lap-highlight" : ""} ${session.toLowerCase() === "race" ? "d-none d-md-table-cell" : ""}`}>
                        {session.toLowerCase() === "qualifying" ? (
                          <>
                            <span className="d-none d-md-inline">{msToTime(res.FastestLapTime)}</span>
                            <span className="d-md-none">
                              {i && winner?.FastestLapTime
                                ? `+${msToTime(res.FastestLapTime - winner.FastestLapTime)}`
                                : msToTime(res.FastestLapTime)}
                            </span>
                          </>
                        ) : (
                          msToTime(res.FastestLapTime)
                        )}
                      </td>
                      {
                        session.toLowerCase() === "qualifying" ?
                        <td className="d-none d-md-table-cell">
                          {i && winner?.FastestLapTime ? " (+" + msToTime(res.FastestLapTime - winner.FastestLapTime) + ")":<></>}
                        </td>
                        :<></>
                      }
                      <td className="justify-content-md-center display-flex">
                        {!isHistorical && (
                          <>
                            <Button
                              onClick={() => rowClick(res)}
                              size="sm"
                              variant="outline-info"
                              className="d-none d-md-inline-flex"
                            >
                              Details
                            </Button>
                            <Button
                              onClick={() => rowClick(res)}
                              size="sm"
                              variant="outline-info"
                              className="d-inline-flex d-md-none"
                              aria-label="Open details"
                            >
                              <i className="bi bi-three-dots-vertical" aria-hidden="true"></i>
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <></>
              )}
            </tbody>
          </Table>
        </TableContainer>
      </RaceAnalyticsProvider>
    </>
  );
};

export default SessionHistoryEntryScoreboard;
