import React from 'react'
import { Container, Row, Carousel, Image, Button, Col } from 'react-bootstrap';
import PageHeader from '../shared/PageHeader'
import { FaYoutube, FaTwitch } from "react-icons/fa";


const imageInfo = [
    {
        url: "homepage/kartgrid.jpg",
        caption: "Karting Fall '24"
    },
    {
        url: "homepage/ginettas.jpg",
        caption: "Ginetta GT5s @ Daytona Roval",
        href: "https://youtu.be/WpYystD5N-U?si=OCRXFccgjdf_C6AL"
    },
    {
        url: "homepage/kartsontrack.jpg",
        caption: "Karting Fall '24"
    },
    {
        url: "homepage/formulajuniors.jpg",
        caption: "Formula Juniors @ Spa-Francorchamps 1970",
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

export default function Home(){
    return (
        <Container>
            <Row>
                {
                  process.env.REACT_APP_ENV === "Skidmark Tour" ?
                  <PageHeader title="Home of The Skidmark Tour"/>: <></>
                }
            </Row>
            <Row className='justify-content-md-center homepage-content'>
                <Carousel className='homepage-carousel' fade>
                {
                    imageInfo.map((img,i) => (
                        <Carousel.Item key={i} interval={3000} className='homepage-carousel-item'>
                            {
                                img.href ?
                                    <a href={img.href}>
                                        <Image src={img.url} fluid/>
                                    </a>
                                    :
                                    <Image src={img.url} fluid/>
                            }
                            <Carousel.Caption>
                                <p>{img.caption}</p>
                            </Carousel.Caption>
                        </Carousel.Item>
                    ))
                }
                </Carousel>
            </Row>
            <hr/>
            <Row>
                <h2 className='homepage-content'>Our Socials</h2>
            </Row>
            <Row lg="auto" className='social-list justify-content-md-center'>
                {
                    socialInfo.map((soc,i) => (
                        <Col key={i} >
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
