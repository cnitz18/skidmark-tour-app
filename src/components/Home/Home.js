import React from 'react'
import { Container, Row } from 'react-bootstrap';
import PageHeader from '../shared/NewServerSetupPageHeader'

export default function Home(){
    return (
        <Container>
            <Row>
                <PageHeader title="Skidmark Tour Official Website"/>
            </Row>
            <Row>
                <p className='text-center'>
                    Race history brought to you by the "chewsday" dedicated server.
                </p>
            </Row>
        </Container>
    );
}
