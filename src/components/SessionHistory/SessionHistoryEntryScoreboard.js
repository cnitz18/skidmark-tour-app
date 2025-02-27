import { useEffect, useState } from "react";
import { Modal, Button, Spinner } from 'react-bootstrap';
import getAPIData from "../../utils/getAPIData";
import { Table, TableContainer } from "@mui/material";


const SessionHistoryEntryScoreboard = ({ race, vehicles, winner, session, multiclass }) => {
  const [showModal, setShowModal] = useState(false);
  const [eventsData, setEventsData] = useState("")
  const [selectedRacerName, setSelectedRacerName] = useState("")
  const [participantsMap, setParticipantsMap] = useState({});
  const [showSpinner, setShowSpinner] = useState(true);
  const [minSectors,setMinSectors] = useState({});

  const handleCloseModal = () => {
    setEventsData([]);
    setMinSectors({});
    setShowModal(false)
  };
  const handleShowModal = () => setShowModal(true);

  function msToTime(s) {
    // Pad to 2 or 3 digits, default is 2
    function pad(n, z) {
      z = z || 2;
      return ('00' + n).slice(-z);
    }
  
    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
    var hrs = (s - mins) / 60;

    var str = pad(secs) + '.' + pad(ms, 3);
    if( mins )
      str = pad(mins) + ':' + str;
    if( hrs )
      str = pad(hrs) + ':' + str;
    return str;
  }

  function rowClick(res){
    //console.log('click:',res)
    let stage_id = res["stage"]
    let participant_id = res["participantid"]
    setSelectedRacerName(res["name"])
    //console.log(stage_id,participant_id)
    //TODO: set actual loading signal
    //console.log('loading...')
    getAPIData(`/api/batchupload/sms_stats_data/entries/?stage_id=${stage_id}&participant_id=${participant_id}`)
    .then((res) => {
      //console.log('api response:',res)
      setEventsData(res)
      setShowSpinner(false);
    }).catch((e) => {
      setShowSpinner(false);
    })
    handleShowModal()
  }

  function getEventName( event_name ){
    switch( event_name ){
      case 'CutTrackStart':
        return "Off-Track Start";
      case 'CutTrackEnd':
        return "Off-Track End";
      case 'State':
        return "State Change";
      default:
        return event_name;
    }
  }

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
        <Modal.Header closeButton>
          <Modal.Title>{session} Details for {selectedRacerName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {
            showSpinner ?
            <div className="text-center mt-4">
              <Spinner animation="border" role="status"/>
                <div>
                  Loading event data...
                </div>
            </div>
            :
            eventsData &&
                  eventsData.length > 0 ? 
                    <TableContainer>
                      <h5>Lap Log</h5>
                      <Table>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Time</th>
                            <th>Sector 1</th>
                            <th>Sector 2</th>
                            <th>Sector 3</th>
                            <th>Position</th>
                          </tr>
                        </thead>
                        <tbody>  
                          {
                            eventsData.filter(evt => evt.event_name === "Lap").map((evt,i) => (
                              <tr key = {i}>
                                <td>{i+1}</td>                            
                                <td className={evt.attributes_LapTime === minSectors.total ? "personal-fastest-lap-highlight" : ""}>{msToTime(evt.attributes_LapTime)}</td>
                                <td className={evt.attributes_Sector1Time === minSectors.sector1 ? "personal-fastest-sector-highlight" : ""}>{msToTime(evt.attributes_Sector1Time)}</td>
                                <td className={evt.attributes_Sector2Time === minSectors.sector2 ? "personal-fastest-sector-highlight" : ""}>{msToTime(evt.attributes_Sector2Time)}</td>
                                <td className={evt.attributes_Sector3Time === minSectors.sector3 ? "personal-fastest-sector-highlight" : ""}>{msToTime(evt.attributes_Sector3Time)}</td>
                                <td>{evt.attributes_RacePosition}</td>
                              </tr>
                            ))
                          }
                        </tbody>
                      </Table>
                      <hr/>
                      <h5>Other Events</h5>
                      <Table>
                        <thead>
                          <tr>
                            <th>Session Timestamp</th>
                            <th>Event Type</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>  
                          {
                            eventsData.filter(evt => evt.event_name !== "Lap").map((evt,i) => (
                              <tr key={i}>
                                <td>{(new Date(evt.time*1000)).toLocaleTimeString()}</td>
                                <td>{getEventName(evt.event_name)}</td>
                                <td>{getEventDescription(evt)}</td>
                              </tr>
                            ))
                          }
                        </tbody>
                      </Table>
                    </TableContainer>
                  : <span>No event data found</span>
          }
          
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <TableContainer>
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
              <th>
                {
                  session.toLowerCase() === "qualifying" ?
                  <th>Delta</th> : <></>
                }
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
                            "+" + msToTime(res.TotalTime - winner.TotalTime) 
                            : 
                              msToTime(res.TotalTime)
                          )
                        }
                      </td>
                      : <></>
                    }
                    <td className={res.IsFastestLap ? "fastest-lap-highlight" : ""}>{msToTime(res.FastestLapTime)}</td>
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
