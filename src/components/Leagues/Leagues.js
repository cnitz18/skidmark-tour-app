import { Container, Row, Col, Modal, Form, Table, Spinner, Button } from "react-bootstrap";
import { Card, CardActions, CardContent, CardMedia, Chip } from "@mui/material";
import PageHeader from "../shared/PageHeader";
import { useEffect, useState, useCallback } from "react";
import postAPIData from "../../utils/postAPIData";
import getAPIData from "../../utils/getAPIData";
import { Link } from "react-router-dom";
import { BsTrophy } from "react-icons/bs";
import './Leagues.css';

const DEFAULT_POSITIONS = [
    { position: 1, points: 10 },
    { position: 2, points: 8 },
    { position: 3, points: 6 },
    { position: 4, points: 5 },
    { position: 5, points: 4 },
    { position: 6, points: 3 },
    { position: 7, points: 2 },
    { position: 8, points: 1 },
]

const DEFAULT_SPRINT_POSITIONS = [
    { position: 1, points: 4 },
    { position: 2, points: 3 },
    { position: 3, points: 2 },
    { position: 4, points: 1 },
]

const getCurrentLocalDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const Leagues = ({ enums, lists, showAdmin=false }) => {
    const [showModal, setShowModal] = useState(false);
    const [newPositions,setNewPositions] = useState([...DEFAULT_POSITIONS])
    const [newSprintPositions,setNewSprintPositions] = useState([...DEFAULT_SPRINT_POSITIONS])
    const [newRaces,setNewRaces] = useState([{ track: parseInt(lists?.tracks?.list[0].id ?? -559709709), date: getCurrentLocalDateTime() }])
    const [newName,setNewName] = useState("");
    const [description,setDescription] = useState("");
    const [newFastestLapPoint,setNewFastestLapPoint] = useState(false);
    const [leagues,setLeagues] = useState([]);
    const [leagueStandings, setLeagueStandings] = useState({});
    const [showSpinner, setShowSpinner] = useState(true);
    const [isFormValid, setIsFormValid] = useState(false);

    // Existing functions remain the same
    const handleCloseModal = () => {
        setNewPositions([...DEFAULT_POSITIONS]);
        setNewSprintPositions([...DEFAULT_SPRINT_POSITIONS]);
        setNewRaces([{ track: parseInt(lists?.tracks?.list[0].id ?? -559709709), date: getCurrentLocalDateTime() }])
        setNewName("")
        setDescription("")
        setNewFastestLapPoint(false)
        setIsFormValid(false);
        setShowModal(false);
    }
    const handleShowModal = () => setShowModal(true);
    function addNewPosition(){
        let curPositions = [...newPositions]
        curPositions.push({ position: 1, points: 1 })
        setNewPositions([...curPositions])
    }
    function updatePosition(e,index,field){
        let curPositions = [...newPositions]
        curPositions[index][field] = parseInt(e.currentTarget.value);
        setNewPositions([...curPositions])
    }

    function addNewSprintPosition(){
        let curPositions = [...newSprintPositions]
        curPositions.push({ position: 1, points: 1 })
        setNewSprintPositions([...curPositions])
    }
    function updateSprintPosition(e,index,field){
        let curPositions = [...newSprintPositions]
        curPositions[index][field] = parseInt(e.currentTarget.value);
        setNewSprintPositions([...curPositions])
    }

    function addNewRace(){
        let curRaces = [...newRaces];
        curRaces.push({ track: parseInt(lists?.tracks.list[0].id), date: getCurrentLocalDateTime() })
        setNewRaces([...curRaces])
    }
    function updateRace(e,index,field){
        let curRaces = [...newRaces];
        if( field === "track")
            curRaces[index][field] = parseInt(e.currentTarget.value);
        else if (field === "date"){
            curRaces[index][field] = e.currentTarget.value;
        }
        else {
            curRaces[index][field] = e.currentTarget.value
        }
        setNewRaces([...curRaces])    
    }

    const validateForm = useCallback(() => {
        if (!newName.trim()) return false;
        if (!description.trim()) return false;
        if (newPositions.length === 0) return false;
        for (let pos of newPositions) {
            if (!pos.position || pos.position <= 0 || !pos.points || pos.points <= 0) return false;
        }
        for (let pos of newSprintPositions) {
            if (!pos.position || pos.position <= 0 || !pos.points || pos.points <= 0) return false;
        }
        if (newRaces.length === 0) return false;
        for (let race of newRaces) {
            if (!race.track) return false;
            if (!race.date) return false;
        }
        return true;
    }, [newName, description, newPositions, newSprintPositions, newRaces]);

    function saveNewLeague(){
        if (!isFormValid) return;
        let data = {
            name: newName,
            points: newPositions,
            sprintPoints: newSprintPositions,
            extraPointForFastestLap: newFastestLapPoint,
            races: newRaces.map(r => ({ ...r, date: new Date(r.date).toISOString() })),
            description,
            completed: false
        }
        postAPIData('/leagues/create/',data)
        .then(() => handleCloseModal())
    }

    useEffect(() => {
        setIsFormValid(validateForm());
    }, [validateForm]);

    useEffect(() => {
        setShowSpinner(true);
        getAPIData('/leagues/get/').then(async (res) => {
            setLeagues([...res]);
            
            // Fetch standings for completed leagues
            const completedLeagues = res.filter(league => league.completed);
            const standingsData = {};
            
            for (const league of completedLeagues) {
                try {
                    const standings = await getAPIData(`/leagues/get/stats/?id=${league.id}`);
                    if (standings && standings.scoreboard_entries?.length > 0) {
                        standings.champion = standings.scoreboard_entries.find((ent) => ent.Position === 1)?.PlayerName;
                        standingsData[league.id] = standings;
                    }
                } catch (err) {
                    console.error(`Failed to fetch standings for league ${league.id}`, err);
                }
            }

            setLeagueStandings(standingsData);
            setShowSpinner(false);
        });
    }, []);
    
    return (
        <Container>
            <PageHeader title="Leagues"/>
            {
                showAdmin ?
                <Row className="text-center">
                    <Col className="text-center">
                        <Button onClick={handleShowModal}>Create New League</Button>
                    </Col>
                </Row> : <></>
            }
            <Row xs={1} md={1} lg={2} className="g-4 justify-content-center leagues-container">
            {showSpinner ? (
                <div className="text-center mt-4">
                    <Spinner animation="border" role="status"/>
                    <div>
                        One moment please...
                    </div>
                </div>
                ) : (
                    (leagues && leagueStandings) && leagues.map((l, i) => {
                        const champion = l.completed && leagueStandings[l.id] ? leagueStandings[l.id]?.champion : null;
                        return (
                            <Col key={i}>
                                <Card className="text-center league-card">
                                    <CardMedia image={l.img} height="200" component="img" alt="Photo Credit https://ams2cars.info/"/>
                                    <CardContent>
                                        <h5>{l.name}</h5>
                                        {l.completed && champion && (
                                            <div className="champion-ribbon">
                                                <div className="champion-header">Season Champion</div>
                                                <div className="champion-details">
                                                    <BsTrophy className="champion-icon" />
                                                    <span className="champion-name">{champion}</span>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                    <CardActions className="league-cardactions">
                                        <Link
                                            to={`/league/${l.id}`}
                                            state={{ league: l }}
                                            >
                                            <Button variant="outline-primary" size="sm">View Details</Button>
                                        </Link>
                                        <div className="league-display-badge">
                                            {
                                                l.completed ?
                                                <Chip size="small" label="Complete" color="success" variant="outlined"/>
                                                : <Chip size="small" label="In Progress" color="information" variant="outlined"/>
                                            }
                                        </div>
                                    </CardActions>
                                </Card>
                            </Col>
                        );
                    })
                )
            }
            </Row>
            
            {/* Modal code remains unchanged */}
            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>New League</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row className="mb-3">
                            <Form.Group as={Col} controlId="formGridName">
                                <Form.Label>League Name *</Form.Label>
                                <Form.Control placeholder="Enter name" onChange={(e) => setNewName(e.target.value)} />
                            </Form.Group>
                        </Row>
                        <Row>
                            <Form.Group as={Col}>
                                <Form.Label>Description *</Form.Label>
                                <Form.Control as="textarea" rows={3} placeholder="Give a lil info here" onChange={(e) => setDescription(e.target.value)} />
                            </Form.Group>
                        </Row>
                        <br/>
                        <Row>
                            <Col md={6}>
                                <h5>Scoring System</h5>
                                <hr/>
                                <Table striped bordered size="sm">
                                    <thead>
                                        <tr>
                                            <th>Pos</th>
                                            <th>Pts</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            newPositions?.map((pos,i) => (
                                                <tr key={i}>
                                                    <td>
                                                        <Form.Control size="sm" type="number" value={pos.position} onChange={(e) => updatePosition(e,i,"position")}/>
                                                    </td>
                                                    <td>
                                                        <Form.Control size="sm" type="number" value={pos.points} onChange={(e) => updatePosition(e,i,"points")}/>
                                                    </td>
                                                </tr>
                                            ))
                                        }
                                    </tbody>
                                </Table>
                                <div className="text-center mb-3">
                                    <Button variant="outline-primary" size="sm" onClick={addNewPosition}>Add Position</Button>
                                </div>
                            </Col>
                            <Col md={6}>
                                <h5>Sprint Scoring</h5>
                                <hr/>
                                <Table striped bordered size="sm">
                                    <thead>
                                        <tr>
                                            <th>Pos</th>
                                            <th>Pts</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            newSprintPositions?.map((pos,i) => (
                                                <tr key={i}>
                                                    <td>
                                                        <Form.Control size="sm" type="number" value={pos.position} onChange={(e) => updateSprintPosition(e,i,"position")}/>
                                                    </td>
                                                    <td>
                                                        <Form.Control size="sm" type="number" value={pos.points} onChange={(e) => updateSprintPosition(e,i,"points")}/>
                                                    </td>
                                                </tr>
                                            ))
                                        }
                                    </tbody>
                                </Table>
                                <div className="text-center mb-3">
                                    <Button variant="outline-primary" size="sm" onClick={addNewSprintPosition}>Add Sprint Position</Button>
                                </div>
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
                    <Button variant="primary" onClick={saveNewLeague} disabled={!isFormValid}>
                        Save League
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
 
export default Leagues;