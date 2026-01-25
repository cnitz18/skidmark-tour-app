import { Container, Row, Col, Button } from "react-bootstrap"
import PageHeader from "../shared/PageHeader";
import fullLogo from "../../assets/Skidmark_Logo_1.png";

const ServerLanding = ({ enums, lists }) => {
    return (
        <Container>
            <Row>
                <PageHeader title="Dedicated Server" logo={fullLogo}/>
            </Row>
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