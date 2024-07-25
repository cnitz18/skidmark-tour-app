import { useEffect, useState } from "react";
import {  Container, Row, Col, Button } from "react-bootstrap"
import PageHeader from "../shared/NewServerSetupPageHeader";

const ServerLanding = ({ enums, lists }) => {
    return (
        <Container>
            <Row>
                <PageHeader title="Dedicated Server"/>
            </Row>
            <Row>
                <p className='text-center'>
                    Lorem Ipsum something informative here...
                </p>
            </Row>
            <Row>
                <Button href={process.env.REACT_APP_SERVER_LOC} target="_blank">
                    Server Management Page 
                </Button>
            </Row>
        </Container>
    );
};
export default ServerLanding;