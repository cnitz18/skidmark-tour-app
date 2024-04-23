import React from 'react'
import { useEffect, useState } from 'react';
import { Container, Spinner, Row, Col, Table, Form, Tooltip, OverlayTrigger } from 'react-bootstrap';
import PageHeader from '../shared/NewServerSetupPageHeader';
import getAPIData from '../../utils/getAPIData';
import { useLocation } from "react-router-dom";

const LeagueDescription = ({ enums, lists }) => {
    const [showSpinner, setShowSpinner] = useState(true);
    const [league, setLeague] = useState({});
    const [leagueDetails, setLeagueDetails] = useState({});
    const { state } = useLocation();

    useEffect(() => {
        if( state.league ){
            console.log('setting league:',{...state.league})
            setLeague({...state.league});
        }else if( state.leagueId ){
            console.log('league id received')
            getAPIData('/leagues/get/?id='+state.leagueId)
            .then((res) => {
                setLeague({...res})
            })
        }
    },[state.league,state.leagueId])
    useEffect(() => {
        if( league && league.id )
            getAPIData('/leagues/get/stats/?id=' + league.id).then((res) => {
                console.log('setting league details:',res)
                setLeagueDetails({...res})
                setShowSpinner(false)
            }).catch((err) => { console.error(err); setShowSpinner(false) })
    },[league])
    return (
        <Container>
            
            {showSpinner ? (

                <div className="text-center mt-4">
                    <Spinner animation="border" role="status"/>
                    <div>
                        One moment please...
                    </div>
                </div>
                ) : ( league &&
                    <>  
                        <PageHeader title={league.name}/>
                        <Container>
                            <Row>
                                {/* Main panel */}
                                <Col sm={8}>
                                    <Row>
                                        <b>Description:</b>
                                        <span>{league.description}</span>
                                    </Row>
                                    <Row>
                                    <Container fluid="sm">  
                                        <Row>
                                            <Col md={{ span: 6, offset: 3 }}>
                                                <span className='text-center'>
                                                    <h4>Current Standings</h4>
                                                </span>
                                                {
                                                    (leagueDetails && leagueDetails?.scoreboard_entries) 
                                                    && 
                                                    <Table size="sm" hover>
                                                        <thead>
                                                            <tr>
                                                                <th>Position</th>
                                                                <th>Name</th>
                                                                <th>Points</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                        {
                                                            leagueDetails.scoreboard_entries.map((ent,i,arr) => (
                                                                <OverlayTrigger
                                                                    placement="right"
                                                                    overlay={(props) => (
                                                                        <Tooltip {...props} className="text-left">
                                                                          <span>
                                                                            Races Won: { ent.Wins }
                                                                            <br/>
                                                                            Pole Positions: { ent.Poles }
                                                                            <br/>
                                                                            Fastest Laps: { ent.FastestLaps }
                                                                            <br/>
                                                                            Podium Finishes: { ent.Podiums }
                                                                            <br/>
                                                                            Points Finishes: { ent.PointsFinishes }
                                                                          </span>
                                                                        </Tooltip>
                                                                      )}
                                                                >
                                                                    <tr key={i}>
                                                                        <td>{ent.Position === arr[i-1]?.Position ? '' : ent.Position}</td>
                                                                        <td>{ent.PlayerName}</td>
                                                                        <td>{ent.Points === arr[i-1]?.Points ? '' : ent.Points}</td>
                                                                    </tr>
                                                                </OverlayTrigger>
                                                            ))
                                                        }
                                                        </tbody>
                                                    </Table>
                                                }
                                                More content to come
                                            </Col>
                                        </Row>
                                        </Container>
                                    </Row>
                                </Col>
                                {/* Right-side config panel */}
                                <Col sm={4} className='league-config-panel'>
                                    <Row>
                                        <b>Points System</b>
                                        <Container fluid="sm">
                                        {
                                            league.points?.length ?
                                            <Row className='text-center'>
                                                <Col md={{ span: 6, offset: 3 }}>
                                                    <Table size="sm">
                                                        <thead>
                                                            <tr>
                                                                <th>Pos.</th>
                                                                <th>Points</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {league.points.map((p,i) => (
                                                                <tr key={i}>
                                                                    <td>{"P" + p.position}</td>
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
                                            <Col>
                                                <Form.Check 
                                                    label="Extra point for fastest lap?"
                                                    type="checkbox" 
                                                    checked={league?.extraPointForFastestLap} 
                                                    disabled/>
                                            </Col>
                                        </Row>
                                        </Container>
                                    </Row>
                                    <hr/>
                                    <Row>
                                        <b>Race Calendar:</b>
                                        {
                                            league.races?.length ?
                                            <Container fluid="sm" className='text-center'>
                                                <Col>
                                                    <Table size="sm" striped bordered>
                                                        <tbody>
                                                            {league.races.map((r,i) => (
                                                                <tr key={i}>
                                                                    <td>{(new Date(r.date)).toLocaleDateString()+ " @ " + (new Date(r.date)).toLocaleString("en",{timeStyle:'short'})}</td>
                                                                    <td>{lists["tracks"]?.list?.find((t) => t.id === r.track)?.name ?? "[undefined: error]"}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </Col>
                                            </Container>
                                            :<>
                                                Error... no points data found
                                            </>
                                            
                                        }
                                    </Row>
                                </Col>
                            </Row>
                        </Container>
                    </>
                )
            }

        </Container>
    )
}
 
export default LeagueDescription;