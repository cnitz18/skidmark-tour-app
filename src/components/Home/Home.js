import React, { useEffect, useState } from 'react';
import { Container, Row, Carousel, Image, Col, Card, Spinner } from 'react-bootstrap';
import PageHeader from '../shared/PageHeader'
import { FaYoutube, FaTwitch } from "react-icons/fa";
import styles from './Home.module.css';
import { getLiveStreams } from '../../utils/twitchApi';
import LiveStreams from './LiveStreams';
import getAPIData from '../../utils/getAPIData';
import fullLogo from "../../assets/Skidmark_Logo_1.png";

const imageInfo = [
    {
        url: "homepage/kartgrid.jpg",
        caption: "Karting Fall '24"
    },
    {
        url: "homepage/monza-sprint-finish.jpg",
        caption: "Nailbiter Finish @ Monza '71",
        href: "https://www.youtube.com/watch?v=xwN_Ch8Hexo"
    },
    {
        url: "homepage/kartsontrack.jpg",
        caption: "Karting Fall '24"
    },
    {
        url: "homepage/arccamaros.jpg",
        caption: "Door Banging @ Yahuarcocha (link)",
        href: "https://www.youtube.com/watch?v=4KDvMUHPLDw"
    },
    {
        url: "homepage/irl.jpg",
        caption: "Karting Fall '24"
    },
    {
        url: "homepage/formulajuniors.jpg",
        caption: "Formula Juniors @ Spa-Francorchamps 1970 (link)",
        href: "https://youtu.be/yMqXIcBbhxo?si=5iHQGi5Mn_rXBd3v"
    },
    {
        url: "homepage/karting-fall-25.jpg",
        caption: "Karting Fall '25",
    }
]

const socialInfo = [
    {
        platform: "youtube",
        name: "verydystrbd",
        link: "https://www.youtube.com/verydystrbd"
    },
    {
        platform: "youtube",
        name: "Vandy1397",
        link: "https://www.youtube.com/Vandy1397"
    },
    {
        platform: "twitch",
        name: "verydystrbd",
        link: "https://www.twitch.tv/verydystrbd"
    },
    {
        platform: "twitch",
        name: "nalyd_97",
        link: "https://www.twitch.tv/nalyd_97"
    },
    {
        platform: "twitch",
        name: "TheGilles",
        link: "https://www.twitch.tv/thegilles"
    },
    {
        platform: "twitch",
        name: "g_vonny",
        link: "https://www.twitch.tv/g_vonny"
    }
]

export default function Home() {
    const [liveStreams, setLiveStreams] = useState([]);
    const [leagueData, setLeagueData] = useState(null);
    const [loading, setLoading] = useState(true);
    const CURRENT_LEAGUE_ID = 29; // Update twice yearly
    
    useEffect(() => {
        const twitchUsernames = socialInfo
            .filter(social => social.platform === 'twitch')
            .map(social => social.name);            
        getLiveStreams(twitchUsernames)
            .then(streams => {
                setLiveStreams(streams)
            });
    }, []);

    useEffect(() => {
        // Fetch current league data
        console.log('Fetching league data for ID:', CURRENT_LEAGUE_ID);
        getAPIData(`/leagues/get/stats/?id=${CURRENT_LEAGUE_ID}`)
            .then(data => {
                console.log('League data received:', data);
                setLeagueData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching league data:', err);
                setLoading(false);
            });
    }, []);

    return (
        <div className={styles.homePage}>
            {process.env.REACT_APP_ENV === "Skidmark Tour" && (
                <PageHeader 
                    title="Home of The Skidmark Tour"
                    logo={fullLogo}
                />
            )}
            <div className={styles.heroSection}>
                <Container fluid>
                    <Row className='justify-content-center'>
                        <Col md={10} lg={8}>
                            <Carousel fade className={styles.carousel}>
                                {imageInfo.map((img,i) => (
                                    <Carousel.Item key={i} interval={3000}>
                                        {img.href ? (
                                            <a href={img.href} className={styles.carouselLink} target="_blank" rel='noopener noreferrer'>
                                                <Image src={img.url} fluid/>
                                                <div className={styles.overlay}></div>
                                            </a>
                                        ) : (
                                            <>
                                                <Image src={img.url} fluid/>
                                                <div className={styles.overlay}></div>
                                            </>
                                        )}
                                        <Carousel.Caption className={styles.caption}>
                                            <h3>{img.caption}</h3>
                                        </Carousel.Caption>
                                    </Carousel.Item>
                                ))}
                            </Carousel>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* League Standings Section */}
            <Container className={styles.leagueSection}>
                {loading ? (
                    <Row className='justify-content-center py-5'>
                        <Col className='text-center'>
                            <Spinner animation="border" variant="info" />
                        </Col>
                    </Row>
                ) : leagueData && leagueData.scoreboard_entries ? (
                    <>
                        <Row className='mb-4'>
                            <Col>
                                <h2 className={styles.sectionTitle}>League Standings</h2>
                                <p className={styles.leagueSubtitle}>Current Championship Standings</p>
                            </Col>
                        </Row>
                        
                        <Row className='mb-5'>
                            <Col md={12} lg={8} className='mx-auto'>
                                <Card className={styles.leagueCard}>
                                    <Card.Body>
                                        <div className={styles.podiumContainer}>
                                            {leagueData.scoreboard_entries.slice(0, 3).map((entry, idx) => (
                                                <div key={idx} className={`${styles.podiumSpot} ${styles[`position${entry.Position}`]}`}>
                                                    <div className={styles.podiumRank}>
                                                        <span className={styles.medalists}>{['🥇', '🥈', '🥉'][idx]}</span>
                                                    </div>
                                                    <div className={styles.podiumDriver}>
                                                        <h4>{entry.PlayerName}</h4>
                                                        <p className={styles.podiumPoints}>{entry.Points} pts</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card.Body>
                                </Card>
                                <div className='text-center mt-4'>
                                    <a href={`/leagues/${CURRENT_LEAGUE_ID}`} className={`btn ${styles.viewButton}`}>
                                        View Full Standings
                                    </a>
                                </div>
                            </Col>
                        </Row>
                    </>
                ) : null}
            </Container>
            
            <Container>
                <LiveStreams streams={liveStreams} />
            </Container>

            <Container className={styles.socialsSection}>
                <Row className="text-center mb-4">
                    <h2>Our Socials</h2>
                </Row>
                <Row lg="auto" className='justify-content-center'>
                    {socialInfo.map((soc,i) => (
                        <Col key={i}>
                            <a 
                                href={soc.link}
                                className={`${styles.socialLink} ${styles[soc.platform]}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {soc.platform === "twitch" ? <FaTwitch/> : <FaYoutube/>}
                                <span>{soc.name}</span>
                            </a>
                        </Col>
                    ))}
                </Row>
            </Container>
        </div>
    );
}
