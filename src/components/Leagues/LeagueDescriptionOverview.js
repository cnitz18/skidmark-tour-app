import { Card, Row, Col, ProgressBar, Badge, Container, Table, Form, Spinner } from 'react-bootstrap';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import NameMapper from '../../utils/Classes/NameMapper';
import msToTime from '../../utils/msToTime'
import { BsTrophy, BsFlag, BsSpeedometer, BsClock, BsStopwatch } from 'react-icons/bs';
import styles from './LeagueDescriptionOverview.module.css';

const LeagueDescriptionOverview = ({league, standings, lists,leagueHistory}) => {
    // Add this near the top with other const declarations
    const [recentRaces, setRecentRaces] = useState([]);
    const [showRecentRacesSpinner, setShowRecentRacesSpinner] = useState(true);
    const nextRace = league?.races.find(race => new Date(race.date) > new Date());
    const topDrivers = standings?.slice(0, 3) || [];

    useEffect(() => {
        // Neecd to add filter for finished races?
        let _recentRaces = leagueHistory
        .sort((a, b) => (new Date()).setUTCSeconds(b.start_time) - (new Date()).setUTCSeconds(a.start_time))
        .slice(0, 3)
        setRecentRaces(_recentRaces);
        if( _recentRaces.length ){
            setShowRecentRacesSpinner(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[leagueHistory])
    
    return (
        <div className="league-dashboard">
            <Card className={`mb-4 ${styles.dashboardCard}`}>
                <Card.Body>
                    <Card.Title className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <BsTrophy className="text-primary me-2" />
                            <h3 className="d-inline">{league.name}</h3>
                        </div>
                        <Badge bg={!league.completed ? "success" : "secondary"} className="px-3 py-2">
                            {!league.completed ? "Active" : "Completed"}
                        </Badge>
                    </Card.Title>
                    <Card.Text className="lead">{league.description}</Card.Text>
                </Card.Body>
            </Card>

            <Row className="g-4 mb-4">
                <Col md={4}>
                    <Card className={styles.dashboardCard}>
                        <Card.Body>
                            <div className={styles.cardTitle}>
                                <BsFlag className="text-danger" />
                                <h5 className="mb-0">Next Race</h5>
                            </div>
                            {
                                nextRace ? (
                                <div className="text-center mt-3">
                                    <h4 className="text-primary mb-3">
                                        {NameMapper.fromTrackId(nextRace.track,lists["tracks"]?.list)}
                                    </h4>
                                    <div className="mb-2">
                                        <BsClock className="me-2 text-muted" />
                                        {format(new Date(nextRace.date), 'PPP')}
                                    </div>
                                    <div className="text-muted">
                                        Start: {format(new Date(nextRace.date), 'p')} (central)
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted text-center mt-3">No upcoming races</p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                
                <Col md={4}>
                    <Card className={styles.dashboardCard}>
                        <Card.Body>
                            <div className={styles.cardTitle}>
                                <BsTrophy className="text-warning" />
                                <h5 className="mb-0">Championship Leaders</h5>
                            </div>
                            <div className={styles.statsWrapper}>
                                {topDrivers.map((driver, index) => (
                                    <div key={index} className="d-flex justify-content-between mb-2">
                                        <span>{driver.Position}. {driver.PlayerName}</span>
                                        <span className="fw-bold">{driver.Points} pts</span>
                                    </div>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4}>
                    <Card className={styles.dashboardCard}>
                        <Card.Body>
                            <div className={styles.cardTitle}>
                                <BsSpeedometer className="text-primary" />
                                <h5 className="mb-0">League Progress</h5>
                            </div>
                            <div className={styles.progressSection}>
                                <ProgressBar 
                                    now={(league?.races.filter(race => new Date(race.date) < new Date()).length / league?.races.length) * 100} 
                                    className="mb-3"
                                />
                                <div className="text-muted">
                                    {league?.races.filter(race => new Date(race.date) < new Date()).length}/{league?.races.length} Races
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4">
                <Col md={6}>
                    <Card className={styles.dashboardCard}>
                        <Card.Body>
                            <div className={styles.cardTitle}>
                                <BsClock className="text-success" />
                                <h5 className="mb-0">Recent Results</h5>
                            </div>
                            { showRecentRacesSpinner ? (
                                <Container className="text-center p-5">
                                    <Spinner animation="border" role="status" variant="primary"/>
                                    <p className="mt-3 text-muted">Loading results...</p>
                                </Container>
                            ) :
                            recentRaces?.length ? (
                                recentRaces.map((race, index) => (
                                    <div key={race.id} className={`recent-race ${index !== 0 ? 'mt-3 pt-3 border-top' : ''}`}>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <h6 className="mb-0">
                                                <BsSpeedometer className="me-2 text-primary" />
                                                {NameMapper.fromTrackId(race.setup.TrackId, lists["tracks"]?.list)}
                                            </h6>
                                            <small className="text-muted">
                                                {format((new Date(0)).setUTCSeconds(race.start_time), 'MMM d, yyyy')}
                                            </small>
                                        </div>
                                        {race.stages.race1?.results && (
                                            <>
                                                <div className={`${styles.winnerHighlight} mt-2`}>
                                                    <BsTrophy className="me-2" />
                                                    {race.stages.race1?.results[0]?.name}
                                                    <span className="text-muted ms-2 small">
                                                        ({msToTime(race.stages.race1?.results[0]?.FastestLapTime)}s)
                                                    </span>
                                                </div>
                                                <div className="d-flex justify-content-between small text-muted mt-1">
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
                    <Card className={styles.dashboardCard}>
                        <Card.Body>
                            <div className={styles.cardTitle}>
                                <BsTrophy className="text-warning" />
                                <h5 className="mb-0">Points System</h5>
                            </div>
                            <div className={styles.statsWrapper}>
                                {league && league.points?.length ? (
                                    <>
                                        <Row className="justify-content-center">
                                            <Col xs={8} className="text-center">
                                                {league.points.map((p, i) => (
                                                    <div key={i} className="d-flex justify-content-between align-items-center py-1">
                                                        <span>{NameMapper.positionFromNumber(p.position)}</span>
                                                        <span className="fw-bold">{p.points} pts</span>
                                                    </div>
                                                ))}
                                            </Col>
                                        </Row>
                                        {league?.extraPointForFastestLap && (
                                            <div className="text-muted mt-3 small text-center">
                                                <BsStopwatch className="me-2" />
                                                +1 point for fastest lap
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-muted mb-0">No points system defined</p>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default LeagueDescriptionOverview;