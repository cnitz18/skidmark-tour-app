import React, { useEffect, useState } from 'react';
import { Container, Row, Carousel, Col, Spinner } from 'react-bootstrap';
import { FaYoutube, FaTwitch } from "react-icons/fa";
import styles from './Home.module.css';
import { getLiveStreams } from '../../utils/twitchApi';
import LiveStreams from './LiveStreams';
import getAPIData from '../../utils/getAPIData';
import fullLogo from "../../assets/Skidmark_Logo_1.png";
import FeaturedLeagueCard from '../shared/FeaturedLeagueCard';

const imageInfo = [
    {
        url: "homepage/monza-sprint-finish.jpg",
        caption: "Low Key Last Lap With The Boys (link)",
        href: "https://www.youtube.com/watch?v=xwN_Ch8Hexo"
    },
    {
        url: "homepage/kartsontrack.jpg",
        caption: "Karting Fall '24"
    },
    {
        url: "homepage/skidmarkvsopalas.jpg",
        caption: "2025 Winter Season Highlights (link)",
        href: "https://www.youtube.com/watch?v=LGmDh31O4Rc"
    },
    {
        url: "homepage/karting-fall-25.jpg",
        caption: "Karting Fall '25",
    },
    {
        url: "homepage/arccamaros.jpg",
        caption: "Door Banging @ Yahuarcocha (link)",
        href: "https://www.youtube.com/watch?v=4KDvMUHPLDw"
    },
    {
        url: "homepage/kartgrid.jpg",
        caption: "Karting Fall '24"
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

export default function Home({ lists }) {
    const [liveStreams, setLiveStreams] = useState([]);
    const [league, setLeague] = useState(null);
    const [leagueData, setLeagueData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeSlide, setActiveSlide] = useState(0);
    
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
        // Fetch all leagues and get the latest one
        getAPIData('/leagues/get/')
            .then(leagues => {
                if (leagues && leagues.length > 0) {
                    // Sort by ID descending to get the newest/most recent league
                    const sortedLeagues = [...leagues].sort((a, b) => b.id - a.id);
                    const latestLeague = sortedLeagues[0];
                    const latestLeagueId = latestLeague.id;
                    setLeague(latestLeague);
                    
                    // Now fetch stats for the latest league
                    return getAPIData(`/leagues/get/stats/?id=${latestLeagueId}`);
                }
            })
            .then(data => {
                if (data) {
                    setLeagueData(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching league data:', err);
                setLoading(false);
            });
    }, []);

    return (
        <div className={styles.homePage}>
            <div className={`${styles.heroSection} motion-rise-in`}>
                {/* Integrated Header + Carousel — full bleed, no container */}
                <div className={styles.carouselWrapper}>
                        <Carousel fade className={styles.carousel} onSelect={(index) => setActiveSlide(index)}>
                            {imageInfo.map((img,i) => (
                                <Carousel.Item key={i} interval={3000}>
                                    {img.href ? (
                                        <a href={img.href} className={styles.carouselLink} target="_blank" rel='noopener noreferrer'>
                                            <img src={img.url} alt={img.caption} className={styles.carouselImage} />
                                            <div className={styles.overlay}></div>
                                        </a>
                                    ) : (
                                        <>
                                            <img src={img.url} alt={img.caption} className={styles.carouselImage} />
                                            <div className={styles.overlay}></div>
                                        </>
                                    )}
                                </Carousel.Item>
                            ))}
                        </Carousel>
                        
                        {/* Caption positioned at wrapper bottom, tracks active slide */}
                        <div className={styles.caption}>
                            <h3>{imageInfo[activeSlide]?.caption}</h3>
                        </div>
                        
                        {/* Header Overlay */}
                        <div className={styles.headerOverlay}>
                            <div className={styles.headerContent}>
                                <div className={styles.headerText}>
                                    <h1>Home of The Skidmark Tour</h1>
                                </div>
                                <img src={fullLogo} alt="Skidmark Logo" className={styles.overlayLogo} />
                            </div>
                        </div>
                </div>

                {/* League standings, socials — inside a proper container for mobile centering */}
                <Container>
                    {/* League Standings Section */}
                    <div className={`${styles.leagueSection} motion-fade-in`}>
                    {loading ? (
                        <Row className='justify-content-center py-5'>
                            <Col className='text-center'>
                                <Spinner animation="border" variant="info" />
                            </Col>
                        </Row>
                    ) : league ? (
                        <>
                            <Row>
                                <Col>
                                    <h2 className={styles.sectionTitle}>Current League</h2>
                                </Col>
                            </Row>
                            <FeaturedLeagueCard
                                league={league}
                                standings={leagueData}
                                tracksList={lists?.tracks?.list}
                                compact
                            />
                        </>
                    ) : null}
                    </div>
                    <div className={`${styles.socialsSection} motion-fade-in`}>
                        <h2>Our Socials</h2>
                        <div className={styles.socialsContainer}>
                            {socialInfo.map((soc,i) => (
                                <a 
                                    key={i}
                                    href={soc.link}
                                    className={`${styles.socialLink} ${styles[soc.platform]}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {soc.platform === "twitch" ? <FaTwitch/> : <FaYoutube/>}
                                    <span>{soc.name}</span>
                                </a>
                            ))}
                        </div>
                    </div>

                    <LiveStreams streams={liveStreams} />
                </Container>
            </div>
        </div>
    );
}
