import { Container, Row, Col, Button, Modal, Form, Table, FormGroup } from "react-bootstrap";
import PageHeader from "../shared/NewServerSetupPageHeader";
import { useEffect, useState } from "react";
import postAPIData from "../../utils/postAPIData";

function createLeague(e){
    console.log('create league!!')
}
const Leagues = ({ enums, lists }) => {
    const [showModal, setShowModal] = useState(false);
    const [newPositions,setNewPositions] = useState([{ position: 1, points: 1 }])
    const [newRaces,setNewRaces] = useState([{ track: parseInt(lists?.tracks?.list[0].id), date: formatDateTime(new Date()) }])
    const [newName,setNewName] = useState("");
    const [newFastestLapPoint,setNewFastestLapPoint] = useState(false);

    const handleCloseModal = () => {
        setNewPositions([{ position: 1, points: 1 }]);
        setShowModal(false);
    }
    const handleShowModal = () => setShowModal(true);

    function formatDateTime(datetime){
        let now = datetime
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0,16);
    }

    function addNewPosition(){
        let curPositions = [...newPositions]
        curPositions.push({ position: 1, points: 1 })
        setNewPositions([...curPositions])
    }
    function updatePosition(e,index,field){
        let curPositions = [...newPositions]
        curPositions[index][field] = parseInt(e.currentTarget.value);
        console.log(curPositions)
        setNewPositions([...curPositions])
    }

    function addNewRace(){
        let curRaces = [...newRaces];

        curRaces.push({ track: parseInt(lists?.tracks.list[0].id), date: formatDateTime(new Date()) })
        setNewRaces([...curRaces])
    }
    function updateRace(e,index,field){
        let curRaces = [...newRaces];
        if( field == "track")
            curRaces[index][field] = parseInt(e.currentTarget.value);
        else 
            curRaces[index][field] = e.currentTarget.value
        setNewRaces([...curRaces])    
    }

    function saveNewLeague(){
        let data = {
            name: newName,
            points: newPositions,
            extraPointForFastestLap: newFastestLapPoint,
            races: newRaces,
        }
        postAPIData('/leagues/create/',data).then(console.log)
        console.log('saving new league...',data)
    }
    return (
        <Container>
            <PageHeader title="Leagues"/>
            <Row className="text-center">
                <Col >
                    <Button onClick={handleShowModal}>Create League</Button>
                </Col>
            </Row>
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
                                                <tr>
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
                                                <tr>
                                                    <td>
                                                    <Form.Select onChange={(e) => updateRace(e,i,"track")} aria-label="Track Selection">
                                                        {
                                                            lists && lists.tracks?.list.map((track) => (
                                                                <option value={track.id}>{track.name}</option>
                                                            ))
                                                        }
                                                    </Form.Select>
                                                    </td>
                                                    <td>
                                                        <Form.Control type="datetime-local" value={race.date} onChange={(e) => updateRace(e,i,"date")} />
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