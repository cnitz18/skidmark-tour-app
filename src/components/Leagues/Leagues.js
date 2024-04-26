import { Container, Row, Col, Button, Modal, Form, Table, Card, Spinner } from "react-bootstrap";
import PageHeader from "../shared/NewServerSetupPageHeader";
import { useEffect, useState } from "react";
import postAPIData from "../../utils/postAPIData";
import getAPIData from "../../utils/getAPIData";
import { Link } from "react-router-dom";

const Leagues = ({ enums, lists }) => {
    const [showModal, setShowModal] = useState(false);
    const [newPositions,setNewPositions] = useState([{ position: 1, points: 1 }])
    const [newRaces,setNewRaces] = useState([{ track: parseInt(lists?.tracks?.list[0].id ?? -559709709), date: (new Date()).toISOString().slice(0,16) }])
    const [newName,setNewName] = useState("");
    const [description,setDescription] = useState("");
    const [newFastestLapPoint,setNewFastestLapPoint] = useState(false);
    const [leagues,setLeagues] = useState([]);
    const [showSpinner, setShowSpinner] = useState(true);

    const handleCloseModal = () => {
        setNewPositions([{ position: 1, points: 1 }]);
        setNewRaces([{ track: parseInt(lists?.tracks?.list[0].id ?? -559709709), date: (new Date()).toISOString().slice(0,16) }])
        setNewName("")
        setDescription("")
        setNewFastestLapPoint(false)
        setShowModal(false);
    }
    // const handleShowModal = () => setShowModal(true);

    // function formatDateTime(datetime){
    //     let now = datetime
    //     // now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    //     return now.toISOString().slice(0,16);
    // }

    function addNewPosition(){
        let curPositions = [...newPositions]
        curPositions.push({ position: 1, points: 1 })
        setNewPositions([...curPositions])
    }
    function updatePosition(e,index,field){
        let curPositions = [...newPositions]
        curPositions[index][field] = parseInt(e.currentTarget.value);
        //console.log(curPositions)
        setNewPositions([...curPositions])
    }

    function addNewRace(){
        let curRaces = [...newRaces];

        curRaces.push({ track: parseInt(lists?.tracks.list[0].id), date: (new Date()).toISOString().slice(0,16) })
        setNewRaces([...curRaces])
    }
    function updateRace(e,index,field){
        let curRaces = [...newRaces];
        if( field === "track")
            curRaces[index][field] = parseInt(e.currentTarget.value);
        else if (field === "date"){
            //console.log('setting date:',field,e.currentTarget.value)
            curRaces[index][field] = e.currentTarget.value
        }
        else {
            curRaces[index][field] = e.currentTarget.value
        }
        setNewRaces([...curRaces])    
    }

    function saveNewLeague(){
        // shitty solution but i guess it works to translate dates to backend properly
        // newRaces.forEach((r,i,arr) => {
        //     let now = new Date(r.date)
        //     arr[i].date = now.toISOString().slice(0,16);
        // })
        let data = {
            name: newName,
            points: newPositions,
            extraPointForFastestLap: newFastestLapPoint,
            races: newRaces,
            description,
            completed: false
        }
        //console.log('creating league:',data)
        postAPIData('/leagues/create/',data)
        .then(() => handleCloseModal())
    }

    useEffect(() => {
        setShowSpinner(true);
        getAPIData('/leagues/get/').then((res) => {
            setShowSpinner(false);
            setLeagues([...res])
        })
    },[])
    return (
        <Container>
            <PageHeader title="Leagues"/>
            {/* TODO: only show section below for "admin" users somehow */}
            {/* <Row className="text-center">
                <Col className="text-center">
                    <Button onClick={handleShowModal}>Create New League</Button>
                </Col>
            </Row> */}
            <Row xs={1} md={3} className="g-4 justify-content-center">
            {showSpinner ? (

                <div className="text-center mt-4">
                    <Spinner animation="border" role="status"/>
                    <div>
                        One moment please...
                    </div>
                </div>
                ) : (
                    leagues && leagues.map((l,i) => (
                        <Col key={i}>
                            <Card className="text-center">
                                <Card.Body>
                                    <Card.Title>{l.name}</Card.Title>
                                        <Container>
                                            <Row>
                                                {l.description ?? "No description provided"}
                                            </Row>
                                            <Row>
                                                <Link
                                                    to={`/league/${l.id}`}
                                                    state={{ league: l }}
                                                    >
                                                    <Button variant="outline-primary" size="sm">View</Button>
                                                </Link>
                                            </Row>
                                        </Container>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))
                )
            }
            </Row>
            {/* Modal */}
            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>New League</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row className="mb-3">
                            <Form.Group as={Col} controlId="formGridName">
                                <Form.Label>League Name</Form.Label>
                                <Form.Control placeholder="Enter name" onChange={(e) => setNewName(e.target.value)} />
                            </Form.Group>
                        </Row>
                        <Row>
                            <Form.Group as={Col}>
                                <Form.Label>Description</Form.Label>
                                <Form.Control as="textarea" rows={3} placeholder="Give a lil info here" onChange={(e) => setDescription(e.target.value)} />
                            </Form.Group>
                        </Row>
                        <br/>
                        <h5>Scoring System</h5>
                        <hr/>
                        <Row>   
                            <Container>
                                <Table striped bordered>
                                    <thead>
                                        <tr>
                                            <th>Finishing Position</th>
                                            <th>Points</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            newPositions?.map((pos,i) => (
                                                <tr key={i}>
                                                    <td>
                                                        <Form.Control type="number" value={pos.position} onChange={(e) => updatePosition(e,i,"position")}/>
                                                    </td>
                                                    <td>
                                                        <Form.Control type="number" value={pos.points} onChange={(e) => updatePosition(e,i,"points")}/>
                                                    </td>
                                                </tr>
                                            ))
                                        }

                                    </tbody>
                                </Table>
                            </Container>
                        </Row>
                        <Row className="text-center">
                            <Col>
                                <Button variant="outline-primary" onClick={addNewPosition}>Add Scoring Position</Button>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <Form.Group className="mb-3" id="formGridCheckbox">
                                    <Form.Check type="checkbox" label="Additional point for fastest lap?" value={newFastestLapPoint} onChange={(e) => setNewFastestLapPoint(e.target.value)} />
                                </Form.Group>
                            </Col>
                        </Row>
                        <h5>Event Calendar</h5>
                        <hr/>
                        <Row>
                        <Container>
                                <Table striped bordered>
                                    <thead>
                                        <tr>
                                            <th>Track</th>
                                            <th>Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            newRaces?.map((race,i) => (
                                                <tr key={i}>
                                                    <td>
                                                    <Form.Select onChange={(e) => updateRace(e,i,"track")} aria-label="Track Selection">
                                                        {
                                                            lists && lists.tracks?.list.map((track,i) => (
                                                                <option value={track.id} key={i}>{track.name}</option>
                                                            ))
                                                        }
                                                    </Form.Select>
                                                    </td>
                                                    <td>
                                                        <Form.Control type="datetime-local" value={race.date} onChange={(e) => updateRace(e,i,"date")}/>
                                                    </td>
                                                </tr>
                                            ))
                                        }

                                    </tbody>
                                </Table>
                            </Container>
                        </Row>
                        <Row className="text-center">
                            <Col>
                                <Button variant="outline-primary" onClick={addNewRace}>Add Race</Button>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={saveNewLeague}>
                        Save League
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
 
export default Leagues;