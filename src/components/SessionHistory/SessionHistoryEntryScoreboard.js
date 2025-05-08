import { useEffect, useState } from "react";
import { Modal, Button, Spinner, Nav, Tab, Badge, Card } from 'react-bootstrap';
import getAPIData from "../../utils/getAPIData";
import { Table, TableContainer, Paper } from "@mui/material";
import msToTime from "../../utils/msToTime";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// eslint-disable-next-line no-unused-vars
import styles from "./SessionHistoryEntryScoreboard.css";

const SessionHistoryEntryScoreboard = ({ race, vehicles, winner, session, multiclass }) => {
  const [showModal, setShowModal] = useState(false);
  const [eventsData, setEventsData] = useState([]);
  const [selectedRacerName, setSelectedRacerName] = useState("");
  const [participantsMap, setParticipantsMap] = useState({});
  const [showSpinner, setShowSpinner] = useState(true);
  const [minSectors, setMinSectors] = useState({});
  const [activeTab, setActiveTab] = useState("lapLog");

  const handleCloseModal = () => {
    setEventsData([]);
    setMinSectors({});
    setShowModal(false)
  };
  const handleShowModal = () => setShowModal(true);

  function rowClick(res){
    //console.log('click:',res)
    let stage_id = res["stage"]
    let participant_id = res["participantid"]
    setSelectedRacerName(res["name"])
    //console.log(stage_id,participant_id)
    //TODO: set actual loading signal
    //console.log('loading...')
    getAPIData(`/api/batchupload/sms_stats_data/events/?stage_id=${stage_id}&participant_id=${participant_id}`)
    .then((res) => {
      //console.log('api response:',res)
      setEventsData(res);
      setShowSpinner(false);
    }).catch((e) => {
      setShowSpinner(false);
    })
    handleShowModal()
  }

  // function getEventName( event_name ){
  //   switch( event_name ){
  //     case 'CutTrackStart':
  //       return "Off-Track Start";
  //     case 'CutTrackEnd':
  //       return "Off-Track End";
  //     case 'State':
  //       return "State Change";
  //     default:
  //       return event_name;
  //   }
  // }

  function getEventDescription( evt ){
    switch( evt.event_name ){
      case 'Impact': 
        let player_name = evt.attributes_OtherParticipantId === -1 ? "the wall" : (participantsMap[evt.attributes_OtherParticipantId] ?? "<unnamed driver>")
        return `Contact with ${player_name} (magnitude ${evt.attributes_CollisionMagnitude})`
      case 'CutTrackStart':
        return `Lap ${evt.attributes_Lap} (+${msToTime(evt.attributes_LapTime)}), Running P${evt.attributes_RacePosition}`;
      case 'CutTrackEnd':
        let str = `Elapsed time: ${msToTime(evt.attributes_ElapsedTime)}, Positions Gained: ${evt.attributes_PlaceGain}, Penalty Applied: ${evt.attributes_PenaltyValue}`;
        if( evt.attributes_PlaceGain > 0 )
          str += ". Naughty naughty!!"
        return str;
      case 'State':
        return `Now ${evt.attributes_NewState.replace(/([A-Z])/g, ' $1').trim()}`;
      default:
        return "Uh oh - no output generated for this event type";
    }
  }

  // Format lap data for the chart
  const formatLapDataForChart = () => {
    if (!eventsData || eventsData.length === 0) return [];
    
    return eventsData
      .filter(evt => evt.event_name === "Lap")
      .map((evt, index) => ({
        lap: index + 1,
        lapTime: evt.attributes_LapTime / 1000,
        s1: evt.attributes_Sector1Time / 1000,
        s2: evt.attributes_Sector2Time / 1000,
        s3: evt.attributes_Sector3Time / 1000,
        position: evt.attributes_RacePosition
      }));
  };

  // Get event type with appropriate badge styling
  const getEventBadge = (eventName) => {
    switch(eventName) {
      case 'Impact':
        return <Badge bg="danger">Contact</Badge>;
      case 'CutTrackStart':
        return <Badge bg="warning" text="dark">Off-Track Start</Badge>;
      case 'CutTrackEnd':
        return <Badge bg="warning" text="dark">Off-Track End</Badge>;
      case 'State':
        return <Badge bg="info">State Change</Badge>;
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
              <Nav variant="tabs" className="mb-3 nav-fill">
                <Nav.Item>
                  <Nav.Link eventKey="lapLog" className="d-flex align-items-center justify-content-center">
                    <i className="bi bi-stopwatch me-2"></i>
                    Lap Times
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="lapChart" className="d-flex align-items-center justify-content-center">
                    <i className="bi bi-graph-up me-2"></i>
                    Lap Analysis
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="events" className="d-flex align-items-center justify-content-center">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Race Events
                  </Nav.Link>
                </Nav.Item>
              </Nav>
              
              <Tab.Content>
                <Tab.Pane eventKey="lapLog">
                  <Paper elevation={0} className="p-3 mb-4 border">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
                      <h5 className="mb-2 mb-md-0">Lap Times</h5>
                      <div className="legend-container">
                        <span className="personal-fastest-lap-legend me-3">
                          <span className="color-box"></span> Best Lap
                        </span>
                        <span className="personal-fastest-sector-legend">
                          <span className="color-box"></span> Best Sector
                        </span>
                      </div>
                    </div>
                    
                    <div className="lap-time-table">
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
                                  {msToTime(evt.attributes_LapTime)}
                                </td>
                                <td className={evt.attributes_Sector1Time === minSectors.sector1 ? "personal-fastest-sector-highlight" : ""}>
                                  {msToTime(evt.attributes_Sector1Time)}
                                </td>
                                <td className={evt.attributes_Sector2Time === minSectors.sector2 ? "personal-fastest-sector-highlight" : ""}>
                                  {msToTime(evt.attributes_Sector2Time)}
                                </td>
                                <td className={evt.attributes_Sector3Time === minSectors.sector3 ? "personal-fastest-sector-highlight" : ""}>
                                  {msToTime(evt.attributes_Sector3Time)}
                                </td>
                                <td className="text-center position-cell">
                                  <span className="position-badge">P{evt.attributes_RacePosition}</span>
                                </td>
                              </tr>
                            ))
                          }
                        </tbody>
                      </Table>
                    </div>
                  </Paper>
                </Tab.Pane>
                
                <Tab.Pane eventKey="lapChart">
                  <Paper elevation={0} className="p-3 mb-4 border">
                    <h5 className="mb-3">Lap Time Progression</h5>
                    <div style={{ height: "400px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={formatLapDataForChart()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="lap" label={{ value: 'Lap Number', position: 'insideBottomRight', offset: -10 }} />
                          <YAxis label={{ value: 'Time (sec)', angle: -90, position: 'insideLeft' }} />
                          <Tooltip formatter={(value) => msToTime(value * 1000)} />
                          <Legend />
                          <Line type="monotone" dataKey="lapTime" stroke="#8884d8" name="Lap Time" strokeWidth={2} />
                          <Line type="monotone" dataKey="s1" stroke="#82ca9d" name="Sector 1" />
                          <Line type="monotone" dataKey="s2" stroke="#ffc658" name="Sector 2" />
                          <Line type="monotone" dataKey="s3" stroke="#ff8042" name="Sector 3" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Paper>
                </Tab.Pane>
                
                <Tab.Pane eventKey="events">
                  <Paper elevation={0} className="p-3 mb-4 border">
                    <h5 className="mb-3">Race Events</h5>
                    <div className="events-container">
                      {eventsData.filter(evt => evt.event_name !== "Lap").map((evt, i) => (
                        <Card key={i} className="event-card mb-2">
                          <Card.Body className="p-3">
                            <div className="d-flex align-items-center">
                              <div className="event-time me-3">
                                {(new Date(evt.time*1000)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                              </div>
                              <div className="event-badge me-3">
                                {getEventBadge(evt.event_name)}
                              </div>
                              <div className="event-description">
                                {getEventDescription(evt)}
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                      {eventsData.filter(evt => evt.event_name !== "Lap").length === 0 && (
                        <div className="text-center py-4 text-muted">
                          No events recorded for this session
                        </div>
                      )}
                    </div>
                  </Paper>
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
              <th>Finish Position</th>
              <th>Name</th>
              <th>Vehicle</th>
              {
                session.toLowerCase() === "race" ?
                <th>Time</th> : <></>
              }
              <th>Fastest Lap</th>
                {
                  session.toLowerCase() === "qualifying" ?
                  <th>Delta</th> : <></>
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
                    <td>{vehicles.find((v) => v.id === res.VehicleId)?.name}</td>
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
                    <td className={res.IsFastestLap ? "race-fastest-lap-highlight" : ""}>{msToTime(res.FastestLapTime)}</td>
                    {
                      session.toLowerCase() === "qualifying" ?
                      <td>
                        {i && winner?.FastestLapTime ? " (+" + msToTime(res.FastestLapTime - winner.FastestLapTime) + ")":<></>}
                      </td>
                      :<></>
                    }
                    <td className="justify-content-md-center display-flex">
                      <Button onClick={() => rowClick(res)} size="sm" variant="outline-info">
                        Details
                      </Button> 
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
    </>
  );
};

export default SessionHistoryEntryScoreboard;
