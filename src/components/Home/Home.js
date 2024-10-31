import React from 'react'
import { Container, Row, Carousel, Image, Button, Col, Card } from 'react-bootstrap';
import PageHeader from '../shared/NewServerSetupPageHeader'
import { FaYoutube, FaTwitch } from "react-icons/fa";


const imageInfo = [
    {
        url: "homepage/kartgrid.jpg",
        caption: "Karting Fall '24"
    },
    {
        url: "homepage/ginettas.jpg",
        caption: "Ginetta GT5s @ Daytona Roval"
    },
    {
        url: "homepage/kartsontrack.jpg",
        caption: "Karting Fall '24"
    },
    {
        url: "homepage/formulajuniors.jpg",
        caption: "Formula Juniors @ Spa-Francorchamps 1970"
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

export default function Home(){
    return (
        <Container>
            <Row>
                {
                  process.env.REACT_APP_ENV === "Skidmark Tour" ?
                  <PageHeader title=""/>: <></>
                }
                
            </Row>
            <Row>
                <Carousel fade>
                {
                    imageInfo.map((img,i) => (
                        <Carousel.Item key={i} interval={3000}>
                            <Carousel.Caption>
                                <h3>Home of The {process.env.REACT_APP_ENV}</h3>
                                <p>{img.caption}</p>
                            </Carousel.Caption>
                            <Image src={img.url} fluid/>
                        </Carousel.Item>
                    ))
                }
                </Carousel>
            </Row>
            <hr/>
            <Row>
                <h2 className='homepage-content'>Upcoming Events</h2>
            </Row>
            <Row className='homepage-content'>
                <center>
                    <Card style={{ width: '18rem' }}>
                        <Card.Body>
                            <Card.Title>Event TBD</Card.Title>
                            <Card.Text>
                                Discord Integrations coming soon...
                            </Card.Text>
                            <Button variant="primary">Go Nowhere</Button>
                        </Card.Body>
                    </Card>
                </center>
            </Row>
            <hr/>
            <Row>
                <h2 className='homepage-content'>Our Socials</h2>
            </Row>
            <Row lg="auto" className='social-list justify-content-md-center'>
                {
                    socialInfo.map((soc,i) => (
                        <Col>
                            <Button 
                                key={i} 
                                href={soc.link}
                                variant={soc.platform}>
                                {
                                    soc.platform === "twitch" ? <FaTwitch/>
                                    : soc.platform === "youtube" ? <FaYoutube/>
                                    : <>No platform provided?</>
                                }
                                <span className="social-name">
                                    {soc.name}
                                </span>
                                
                            </Button>
                        </Col>
                    ))
                }

            </Row>
        </Container>
    );
}
