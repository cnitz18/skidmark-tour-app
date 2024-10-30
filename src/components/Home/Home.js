import React from 'react'
import { Container, Row, Carousel, Image } from 'react-bootstrap';
import PageHeader from '../shared/NewServerSetupPageHeader'

const imageInfo = [
    {
        url: "homepage/kartgrid.jpg",
        caption: "Go Karting Fall '24"
    },
    {
        url: "homepage/ginettas.jpg",
        caption: "Ginetta GT5s @ Daytona Roval"
    },
    {
        url: "homepage/kartsontrack.jpg",
        caption: "Go Karting Fall '24"
    },
    {
        url: "homepage/formulajuniors.jpg",
        caption: "Formula Juniors @ Spa-Francorchamps 1970"
    },
    {
        url: "homepage/irl.jpg",
        caption: "Go Karting Fall '24"
    },
    {
        url: "homepage/mustangs.png",
        caption: "Team practice for iRacing Spa 24"
    }
]

export default function Home(){
    return (
        <Container>
            <Row>
                <PageHeader title=""/>
            </Row>
            <Row>
            <Carousel fade>
                {
                    imageInfo.map((img,i) => (
                        <Carousel.Item key={i}>
                            <Carousel.Caption>
                                <h3>Home of The Skidmark Tour</h3>
                                <p>{img.caption}</p>
                            </Carousel.Caption>
                            <Image src={img.url} fluid/>
                        </Carousel.Item>
                    ))
                }
                </Carousel>
            </Row>
        </Container>
    );
}
