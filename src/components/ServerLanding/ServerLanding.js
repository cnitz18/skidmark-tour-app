import { Container, Row, Col, Button } from "react-bootstrap"
import PageHeader from "../shared/PageHeader";

const ServerLanding = ({ enums, lists }) => {
    return (
        <Container>
            <PageHeader title="Dedicated Server"/>
            {/* <Row>
                <p className='text-center'>
                    Lorem Ipsum something informative here...
                </p>
            </Row> */}
            <Row>
                <Col></Col>
                <Col className="center-header">
                    <Button href={process.env.REACT_APP_SERVER_LOC} target="_blank">
                        Launch Server Management Page 
                    </Button>
                </Col>
                <Col></Col>
            </Row>
        </Container>
    );
};
export default ServerLanding;