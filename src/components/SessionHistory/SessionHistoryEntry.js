import { useEffect, useState } from "react";
import { Accordion, Button } from 'react-bootstrap';
import SessionHistoryEntryScoreboard from "./SessionHistoryEntryScoreboard";


const SessionHistoryEntry = ({ data, enums, lists }) => {
    const [startTime,setStartTime] = useState(new Date());
    const [endTime,setEndTime] = useState(new Date());
    const [raceOne,setRaceOne] = useState();

    useEffect(() => {
        setStartTime(new Date(data.start_time * 1000));
        setEndTime(new Date(data.end_time * 1000));
    },[]);
    return (
        <Accordion >
            <div className="history-entry">
                <div className="history-entry-data">
                    <div>
                        {
                            lists['tracks'] ?
                            <h5>{lists['tracks'].list.find(t => t.id === data.setup.TrackId).name}</h5>
                            :<></>
                        }
                    </div>
                    <div>
                        <span>Start Time: </span>
                        <br/>
                        <small>{startTime.toLocaleString()}</small>
                    </div>
                    <div>
                        <span>End Time: </span>
                        <br/>
                        {
                            data.end_time ? 
                            <small>{endTime.toLocaleString()}</small>
                            :<></>
                        }
                    </div>
                    <div>
                        {
                            data.finished ? 
                            <Button variant="outline-success" disabled>Finished</Button> :
                            <Button variant="outline-warning" disabled>Not Finished</Button>
                        }
                    </div>
                </div> 
                <Accordion.Item eventKey={data.index}>
                    <Accordion.Header>
                        Details:    
                    </Accordion.Header>   
                    <Accordion.Body>
                        {/* 
                         add some more details about the server/race here
                        */}
                        {
                            lists['vehicles'] ?
                            <SessionHistoryEntryScoreboard race={data.stages.race1} vehicles={lists['vehicles'].list}/> 
                            :<></>
                        }
                    </Accordion.Body>
                </Accordion.Item>
            </div>
        </Accordion>
    );
}
export default SessionHistoryEntry;