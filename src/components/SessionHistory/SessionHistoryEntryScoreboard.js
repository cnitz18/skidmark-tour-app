import { useEffect, useState } from "react";
import { Modal, Table, Button, Spinner, Container } from 'react-bootstrap';
import getAPIData from "../../utils/getAPIData";


const SessionHistoryEntryScoreboard = ({ race, vehicles, winningTime=0 }) => {
  const [showModal, setShowModal] = useState(false);
  const [eventsData, setEventsData] = useState("")
  const [selectedRacerName, setSelectedRacerName] = useState("")
  const [participantsMap, setParticipantsMap] = useState({});

  const handleCloseModal = () => {
    setEventsData([]);
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
    var str = pad(mins) + ':' + pad(secs) + '.' + pad(ms, 3);
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
    }).catch(console.error)
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
        return `Contact with ${player_name} - magnitude ${evt.attributes_CollisionMagnitude}`
      case 'CutTrackStart':
        return `Lap : ${evt.attributes_Lap}, Position: ${evt.attributes_RacePosition}, at Lap Time ${msToTime(evt.attributes_LapTime)}`;
      case 'CutTrackEnd':
        let str = `Elapsed time: ${msToTime(evt.attributes_ElapsedTime)}, Positions Gained: ${evt.attributes_PlaceGain}, Penalty Applied: ${evt.attributes_PenaltyValue}`;
        if( evt.attributes_PlaceGain > 0 )
          str += ". Naughty naughty!!"
        return str;
      case 'State':
        return `${evt.attributes_PreviousState} => ${evt.attributes_NewState}`;
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
  return (
    <>
      <Modal show={showModal} onHide={handleCloseModal} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {
            eventsData ? 
              eventsData.length > 0 ? 
                <Container>
                  <h5>Laps Logged</h5>
                  <Table striped bordered>
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
                            <td>{evt.attributes_CountThisLapTimes}</td>                            
                            <td>{msToTime(evt.attributes_LapTime)}</td>
                            <td>{msToTime(evt.attributes_Sector1Time)}</td>
                            <td>{msToTime(evt.attributes_Sector2Time)}</td>
                            <td>{msToTime(evt.attributes_Sector3Time)}</td>
                            <td>{evt.attributes_RacePosition}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </Table>
                  <h5>Other Events</h5>
                  <Table striped bordered>
                    <thead>
                      <tr>
                        <th>Event Type</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>  
                      {
                        eventsData.filter(evt => evt.event_name !== "Lap").map((evt,i) => (
                          <tr key={i}>
                            <td>{getEventName(evt.event_name)}</td>
                            <td>{getEventDescription(evt)}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </Table>
                </Container>
              : <span>No event data found</span>
            : 
            <div className="text-center mt-4">
              <Spinner animation="border" role="status"/>
                <div>
                  Loading event data...
                </div>
            </div>
          }
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    <Table striped bordered >
      <thead>
        <tr>
          <th>Finish Position</th>
          <th>Name</th>
          <th>Vehicle</th>
          <th>Time</th>
          <th>Fastest Lap</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {race && race.results && race.results.length ? (
          race.results.map((res, i) => {
            return (
              <tr key={i}>
                <td>{res.RacePosition}</td>
                <td>{res.name}</td>
                <td>{vehicles.find((v) => v.id === res.VehicleId)?.name}</td>
                <td>{ 
                      res.TotalTime < winningTime ?
                      "DNF"
                      :
                      (
                        (i && winningTime) 
                        ? 
                          "+" + msToTime(res.TotalTime - winningTime) 
                        : 
                          msToTime(res.TotalTime)
                      )
                    }
                </td>
                <td>{msToTime(res.FastestLapTime)}</td>
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
    </>
  );
};

export default SessionHistoryEntryScoreboard;
