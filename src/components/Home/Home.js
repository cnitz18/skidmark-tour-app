import React, { useEffect, useState } from 'react';
import { Container, Row, Carousel, Image, Col } from 'react-bootstrap';
import PageHeader from '../shared/PageHeader'
import { FaYoutube, FaTwitch } from "react-icons/fa";
import styles from './Home.module.css';
import { getLiveStreams } from '../../utils/twitchApi';
import LiveStreams from './LiveStreams';

const imageInfo = [
    {
        url: "homepage/kartgrid.jpg",
        caption: "Karting Fall '24"
    },
    {
        url: "homepage/ginettas.jpg",
        caption: "Ginetta GT5s @ Daytona Roval (link)",
        href: "https://youtu.be/WpYystD5N-U?si=OCRXFccgjdf_C6AL"
    },
    {
        url: "homepage/kartsontrack.jpg",
        caption: "Karting Fall '24"
    },
    {
        url: "homepage/formulajuniors.jpg",
        caption: "Formula Juniors @ Spa-Francorchamps 1970 (link)",
        href: "https://youtu.be/yMqXIcBbhxo?si=5iHQGi5Mn_rXBd3v"
    },
    {
        url: "homepage/irl.jpg",
        caption: "Karting Fall '24"
    },
    {
        url: "homepage/mustangs.png",
        caption: "Team practice for iRacing Spa 24"
    }
]

const socialInfo = [
    {
        platform: "youtube",
        name: "verydystrbd",
        link: "https://www.youtube.com/verydystrbd"
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
    
    useEffect(() => {
        const twitchUsernames = socialInfo
            .filter(social => social.platform === 'twitch')
            .map(social => social.name);            
        getLiveStreams(twitchUsernames)
            .then(streams => {
                setLiveStreams(streams)
            });
    }, []);

    return (
        <div className={styles.homePage}>
            <div className={styles.heroSection}>
                <Container fluid>
                    <Row>
                        {process.env.REACT_APP_ENV === "Skidmark Tour" && (
                            <PageHeader 
                                title="Home of The Skidmark Tour"
                            />
                        )}
                    </Row>
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

            {liveStreams.length > 0 && (
                <Container>
                    <LiveStreams streams={liveStreams} />
                </Container>
            )}

            <Container className={styles.socialsSection}>
                <Row className="text-center mb-4">
                    <h2>Connect With Us</h2>
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
