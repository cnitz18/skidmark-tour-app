import { Row, Container, Col, Table, Form } from "react-bootstrap";
import NameMapper from "../../utils/Classes/NameMapper";

const LeagueDescriptionRules = ({league}) => {
    return (<>
        <Row>
            <h4>Points System</h4>
            <Container fluid="sm">
            {
                league && league.points?.length ?
                <Row className='text-center'>
                    <Col md={{ span: 6, offset: 3 }}>
                        <Table size="sm">
                            <thead>
                                <tr>
                                    <th>Finishing Position</th>
                                    <th>Points Awarded</th>
                                </tr>
                            </thead>
                            <tbody>
                                {league.points.map((p,i) => (
                                    <tr key={i}>
                                        <td>{NameMapper.positionFromNumber(p.position)}</td>
                                        <td>{p.points}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Col>
                </Row>
                :<>
                    Error... no points data found
                </>
            
            }
            <Row>
                <div className="schedule-table-div">
                    <Form.Check 
                        label="Extra point for fastest lap?"
                        type="checkbox" 
                        checked={league?.extraPointForFastestLap} 
                        disabled/>
                </div>
            </Row>
            </Container>
        </Row>
    </>);
}
export default LeagueDescriptionRules;