import { Container, Row, Col, Spinner, Button, Card, Badge } from "react-bootstrap";
import PageHeader from "../shared/PageHeader";
import FeaturedLeagueCard from "../shared/FeaturedLeagueCard";
import { useEffect, useState } from "react";
import getAPIData from "../../utils/getAPIData";
import { Link } from "react-router-dom";
import { BsTrophy } from "react-icons/bs";
import './Leagues.css';

const Leagues = ({ enums, lists, showAdmin=false }) => {
    const [leagues,setLeagues] = useState([]);
    const [leagueStandings, setLeagueStandings] = useState({});
    const [isLeaguesLoading, setIsLeaguesLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchLeaguesAndStandings = async () => {
            setIsLeaguesLoading(true);

            try {
                const res = await getAPIData('/leagues/get/');
                const sortedLeagues = [...(res || [])].sort((a, b) => b.id - a.id);

                if (!isMounted) return;
                setLeagues(sortedLeagues);
                setIsLeaguesLoading(false);

                // Fetch standings in the background so league cards can render immediately.
                const standingsPromises = sortedLeagues.map((league) =>
                    getAPIData(`/leagues/get/stats/?id=${league.id}`)
                        .then((standings) => ({ leagueId: league.id, standings, success: true }))
                        .catch((err) => {
                            console.error(`Failed to fetch standings for league ${league.id}`, err);
                            return { leagueId: league.id, standings: null, success: false };
                        })
                );

                Promise.all(standingsPromises).then((results) => {
                    if (!isMounted) return;

                    const standingsData = {};
                    for (const result of results) {
                        if (result.success && result.standings?.scoreboard_entries?.length > 0) {
                            result.standings.champion = result.standings.scoreboard_entries.find((ent) => ent.Position === 1)?.PlayerName;
                            standingsData[result.leagueId] = result.standings;
                        }
                    }

                    setLeagueStandings(standingsData);
                });
            } catch (err) {
                console.error('Failed to fetch leagues', err);
                if (isMounted) {
                    setLeagues([]);
                    setIsLeaguesLoading(false);
                }
            }
        };

        fetchLeaguesAndStandings();

        return () => {
            isMounted = false;
        };
    }, []);
    
    return (
        <Container className="motion-fade-in">
            <PageHeader title="Leagues"/>
            {
                showAdmin ?
                <Row className="text-center">
                    <Col className="text-center">
                        <Button as={Link} to="/leagueadmin/create" variant="primary">Create New League</Button>
                    </Col>
                </Row> : <></>
            }
            {isLeaguesLoading ? (
                <Container className="d-flex justify-content-center align-items-center" style={{minHeight: '400px'}}>
                    <div className="text-center">
                        <Spinner animation="border" role="status"/>
                        <div>
                            One moment please...
                        </div>
                    </div>
                </Container>
            ) : (
                <>
                    {(leagues && leagues.length > 0) && (
                        <div className="leagues-hero-container mb-5 motion-rise-in">
                            <FeaturedLeagueCard
                                league={leagues[0]}
                                standings={leagueStandings[leagues[0].id]}
                                tracksList={lists["tracks"]?.list}
                            />
                        </div>
                    )}

                    <Container className="mt-5">
                        <h2 style={{fontSize: '2rem', fontWeight: 600, marginBottom: '2rem', textAlign: 'center', color: 'var(--color-text)'}}>Past Leagues</h2>
                    </Container>

                    <Row xs={1} md={2} lg={4} className="g-4 justify-content-center leagues-container motion-stagger">
                    {leagues.slice(1).map((l, i) => {
                        const champion = l.completed && leagueStandings[l.id] ? leagueStandings[l.id]?.champion : null;
                        return (
                            <Col key={i}>
                                <Card className="text-center league-card">
                                    <Card.Img variant="top" src={l.img || '/opala-86-1920.jpg'} alt="League"/>
                                    <Card.Body>
                                        <Card.Title>{l.name}</Card.Title>
                                        {l.completed && champion && (
                                            <div className="champion-ribbon">
                                                <div className="champion-header">Season Champion</div>
                                                <div className="champion-details">
                                                    <BsTrophy className="champion-icon" />
                                                    <span className="champion-name">{champion}</span>
                                                </div>
                                            </div>
                                        )}
                                    </Card.Body>
                                    <Card.Footer className="league-cardactions">
                                        <Button
                                            as={Link}
                                            to={`/league/${l.id}`}
                                            state={{ league: l }}
                                            variant="outline-primary"
                                            size="sm"
                                        >
                                            View Details
                                        </Button>
                                        <div className="league-display-badge">
                                            {
                                                l.completed ?
                                                <Badge bg="success">Complete</Badge>
                                                : <Badge bg="secondary">In Progress</Badge>
                                            }
                                        </div>
                                    </Card.Footer>
                                </Card>
                            </Col>
                        );
                    })}
                    </Row>
                    {!leagues.length && (
                        <Container className="text-center mt-4">
                            No leagues found.
                        </Container>
                    )}
                </>
            )}
        </Container>
    );
}
 
export default Leagues;