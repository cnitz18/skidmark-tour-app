import { Card, Row, Col, ProgressBar, Badge, Container, Table, Form } from 'react-bootstrap';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import NameMapper from '../../utils/Classes/NameMapper';
import msToTime from '../../utils/msToTime'

const LeagueDescriptionOverview = ({league, standings, lists,leagueHistory}) => {
    // Add this near the top with other const declarations
    const [recentRaces, setRecentRaces] = useState([]);
    const nextRace = league?.races.find(race => new Date(race.date) > new Date());
    const topDrivers = standings?.slice(0, 3) || [];

    useEffect(() => {
        // Neecd to add filter for finished races?
        setRecentRaces(leagueHistory
            .sort((a, b) => (new Date()).setUTCSeconds(b.start_time) - (new Date()).setUTCSeconds(a.start_time))
            .slice(0, 3));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[leagueHistory])
    
    return (
        <div className="league-dashboard">
            <Card className="mb-4">
                <Card.Body>
                    <Card.Title className="d-flex justify-content-between align-items-center">
                        <h3>{league.name}</h3>
                        <Badge bg={!league.completed ? "success" : "secondary"}>
                            {!league.completed ? "Active" : "Completed"}
                        </Badge>
                    </Card.Title>
                    <Card.Text>{league.description}</Card.Text>
                </Card.Body>
            </Card>

            <Row className="g-4 mb-4">
                <Col md={4}>
                    <Card className="h-100">
                        <Card.Body>
                            <Card.Title>Next Race</Card.Title>
                            {nextRace ? (
                                <div style={{ textAlign: 'center' }}>
                                    <h6>{NameMapper.fromTrackId(nextRace.track,lists["tracks"]?.list)}</h6>
                                    <span>{format(new Date(nextRace.date), 'PPP')}</span>
                                    <br/>
                                    <span>Start Time: {format(new Date(nextRace.date), 'p')} (central)</span>
                                </div>
                            ) : (
                                <p>No upcoming races</p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                
                <Col md={4}>
                    <Card className="h-100">
                        <Card.Body>
                            <Card.Title>Championship Leaders</Card.Title>
                            {topDrivers.map((driver, index) => (
                                <div key={index} className="d-flex justify-content-between mb-2">
                                    <span>{driver.Position}. {driver.PlayerName}</span>
                                    <span>{driver.Points} pts</span>
                                </div>
                            ))}
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4}>
                    <Card className="h-75">
                        <Card.Body>
                            <Card.Title>League Progress</Card.Title>
                            <ProgressBar 
                                now={(league?.races.filter(race => new Date(race.date) < new Date()).length / league?.races.length) * 100} 
                                className="mb-3"
                            />
                            <center>{league?.races.filter(race => new Date(race.date) < new Date()).length}/{league?.races.length} Races</center>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4">
                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <Card.Title>Recent Results</Card.Title>
                            {recentRaces?.length ? (
                                recentRaces.map((race, index) => (
                                    <div key={race.id} className={`recent-race ${index !== 0 ? 'mt-3 pt-3 border-top' : ''}`}>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <h6 className="mb-0">{NameMapper.fromTrackId(race.setup.TrackId, lists["tracks"]?.list)}</h6>
                                            <small className="text-muted">
                                                {format((new Date(0)).setUTCSeconds(race.start_time), 'MMM d, yyyy')}
                                            </small>
                                        </div>
                                        {race.stages.race1?.results && (
                                            <>
                                                <div className="winner">
                                                    <strong>Winner: </strong>
                                                    {race.stages.race1?.results[0]?.name}
                                                    <span className="text-muted ms-2">
                                                        ({msToTime(race.stages.race1?.results[0]?.FastestLapTime)}s)
                                                    </span>
                                                </div>
                                                <div className="d-flex justify-content-between small text-muted">
                                                    <span>P2: {race.stages.race1?.results[1]?.name}</span>
                                                    <span>P3: {race.stages.race1?.results[2]?.name}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted mb-0">No completed races yet</p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <Card.Title>Points System</Card.Title>
                            <Container fluid="sm">
                            {
                                league && league.points?.length ?
                                <Row className='text-center'>
                                    <Col md={{ span: 6, offset: 3 }}>
                                        <Table size="sm">
                                            <thead>
                                                <tr>
                                                    <th>Finishing Position</th>
                                                    <th>Points Awarded</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {league.points.map((p,i) => (
                                                    <tr key={i}>
                                                        <td>{NameMapper.positionFromNumber(p.position)}</td>
                                                        <td>{p.points}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </Col>
                                </Row>
                                :<>
                                    Error... no points data found
                                </>
                            
                            }
                                <Row>
                                    <div className="schedule-table-div">
                                        <Form.Check 
                                            label="Extra point for fastest lap?"
                                            type="checkbox" 
                                            checked={league?.extraPointForFastestLap} 
                                            disabled/>
                                    </div>
                                </Row>
                            </Container>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default LeagueDescriptionOverview;