import React from 'react'
import { useEffect, useState } from 'react';
import { Container, Spinner, Row, Col, Table, Form, Tooltip, OverlayTrigger} from 'react-bootstrap';
import PageHeader from '../shared/NewServerSetupPageHeader';
import getAPIData from '../../utils/getAPIData';
import { useLocation } from "react-router-dom";
import SessionHistoryEntry from '../SessionHistory/SessionHistoryEntry';
import { LineChart } from '@mui/x-charts/LineChart';
import { axisClasses } from "@mui/x-charts";
import { cheerfulFiestaPalette } from '@mui/x-charts/colorPalettes';
import { Tabs, Tab, Box } from '@mui/material'

const LeagueDescription = ({ enums, lists }) => {
    const [showSpinner, setShowSpinner] = useState(true);
    const [showHistorySpinner, setShowHistorySpinner] = useState(true);
    const [league, setLeague] = useState({});
    const [leagueDetails, setLeagueDetails] = useState({});
    const [leagueHistory, setLeagueHistory] = useState([])
    const [tableSeries, setTableSeries] = useState([])
    const { state } = useLocation();

    function dateToDisplayString(dt){
        let dtObj = new Date(dt);

        dtObj.setMinutes(dtObj.getMinutes() + dtObj.getTimezoneOffset());
        return dtObj.toLocaleDateString()+ " @ " + dtObj.toLocaleString("en",{timeStyle:'short'})
    }
    useEffect(() => {
        if( leagueDetails.snapshot && leagueDetails.snapshot.length ){
            // Now we translate it into series data 
            let series_obj = {};
            for( let snap of leagueDetails.snapshot ){
                if( !series_obj[snap.PlayerName] ){
                    let data = [];
                    series_obj[snap.PlayerName] = {
                        id: snap.PlayerName,
                        data,
                        label: snap.PlayerName,
                    }
                }
                series_obj[snap.PlayerName].data[snap.Week-1] = snap.Points;
            }
            // Sort results by final points value
            setTableSeries([...Object.values(series_obj).sort((a,b) => b.data[b.data.length-1] - a.data[a.data.length-1])])
        }
    },[leagueDetails])
    useEffect(() => {
        if( state ){
            if( state.league ){
                    setLeague({...state.league});
            }else if( state.leagueId ){
                getAPIData('/leagues/get/?id='+state.leagueId)
                .then((res) => {
                    setLeague({...res})
                })
            }
        }else {
            let href = window.location.href;
            let leagueId = href.substring(href.lastIndexOf('/')+1)
            getAPIData('/leagues/get/?id='+leagueId)
            .then((res) => {
                setLeague({...res})
            })
        }
        // eslint-disable-next-line
    },[state?.league,state?.leagueId])
    useEffect(() => {
        if( league && league.id ){
            getAPIData('/leagues/get/stats/?id=' + league.id)
            .then((res) => {
                //console.log('setting league details:',res)
                setLeagueDetails({...res})
                setShowSpinner(false)
            }).catch((err) => { console.error(err); setShowSpinner(false) })
            getAPIData('/api/batchupload/sms_stats_data/?league=' + league.id)
            .then((res) => {
                setLeagueHistory([...res])
                setShowHistorySpinner(false)
            }).catch((err) => { console.error(err); setShowHistorySpinner(false) })
        }
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
                ) : 
                ( league &&
                    <Container>

                    </Container>
                    // <>  
                    //     <PageHeader title={league.name}/>
                    //     <Container>
                    //         <Row>
                    //             {/* Main panel */}
                    //             <Col sm={8}>
                    //                 <Row>
                    //                     <b>Description:</b>
                    //                     <p>{league.description}</p>
                    //                     <br/>
                    //                     <hr/>
                    //                 </Row>
                    //                 <Row>
                    //                 <Container>  
                    //                     <Row>
                    //                         <Col md={{ span: 6, offset: 3 }}>
                    //                             <span className='text-center'>
                    //                                 <h4>Standings</h4>
                    //                             </span>
                    //                             {
                    //                                 (leagueDetails && leagueDetails?.scoreboard_entries) 
                    //                                 && 
                    //                                 <Table size="sm" hover>
                    //                                     <thead>
                    //                                         <tr>
                    //                                             <th>Position</th>
                    //                                             <th>Name</th>
                    //                                             <th>Points</th>
                    //                                         </tr>
                    //                                     </thead>
                    //                                     <tbody>
                    //                                     {
                    //                                         leagueDetails.scoreboard_entries.map((ent,i,arr) => (
                    //                                             <OverlayTrigger
                    //                                                 key={i}
                    //                                                 placement="right"
                    //                                                 overlay={(props) => (
                    //                                                     <Tooltip {...props} className="text-left">
                    //                                                       <span>
                    //                                                         Races Won: { ent.Wins }
                    //                                                         <br/>
                    //                                                         Pole Positions: { ent.Poles }
                    //                                                         <br/>
                    //                                                         Fastest Laps: { ent.FastestLaps }
                    //                                                         <br/>
                    //                                                         Podium Finishes: { ent.Podiums }
                    //                                                         <br/>
                    //                                                         Points Finishes: { ent.PointsFinishes }
                    //                                                       </span>
                    //                                                     </Tooltip>
                    //                                                   )}
                    //                                             >
                    //                                                 <tr key={i}>
                    //                                                     <td>{ent.Position === arr[i-1]?.Position ? '' : ent.Position}</td>
                    //                                                     <td>{ent.PlayerName}</td>
                    //                                                     <td>{ent.Points === arr[i-1]?.Points ? '' : ent.Points}</td>
                    //                                                 </tr>
                    //                                             </OverlayTrigger>
                    //                                         ))
                    //                                     }
                    //                                     </tbody>
                    //                                 </Table>
                    //                             }
                    //                         </Col>
                    //                     </Row>
                    //                     </Container>
                    //                 </Row>
                    //             </Col>
                    //             {/* Right-side config panel */}
                    //             <Col sm={4} className='league-config-panel'>
                    //                 <Row>
                    //                     <b>Points System</b>
                    //                     <Container fluid="sm">
                    //                     {
                    //                         league.points?.length ?
                    //                         <Row className='text-center'>
                    //                             <Col md={{ span: 6, offset: 3 }}>
                    //                                 <Table size="sm">
                    //                                     <thead>
                    //                                         <tr>
                    //                                             <th>Pos.</th>
                    //                                             <th>Points</th>
                    //                                         </tr>
                    //                                     </thead>
                    //                                     <tbody>
                    //                                         {league.points.map((p,i) => (
                    //                                             <tr key={i}>
                    //                                                 <td>{"P" + p.position}</td>
                    //                                                 <td>{p.points}</td>
                    //                                             </tr>
                    //                                         ))}
                    //                                     </tbody>
                    //                                 </Table>
                    //                             </Col>
                    //                         </Row>
                    //                         :<>
                    //                             Error... no points data found
                    //                         </>
                                            
                    //                     }
                    //                     <Row>
                    //                         <Col>
                    //                             <Form.Check 
                    //                                 label="Extra point for fastest lap?"
                    //                                 type="checkbox" 
                    //                                 checked={league?.extraPointForFastestLap} 
                    //                                 disabled/>
                    //                         </Col>
                    //                     </Row>
                    //                     </Container>
                    //                 </Row>
                    //                 <hr/>
                    //                 <Row>
                    //                     <b>Race Calendar:</b>
                    //                     {
                    //                         league.races?.length ?
                    //                         <Container fluid="sm" className='text-center'>
                    //                             <Col>
                    //                                 <Table size="sm" striped bordered>
                    //                                     <tbody>
                    //                                         {league.races.map((r,i) => (
                    //                                             <tr key={i}>
                    //                                                 <td>{dateToDisplayString(r.date)}</td>
                    //                                                 <td>{lists["tracks"]?.list?.find((t) => t.id === r.track)?.name ?? "[undefined: error]"}</td>
                    //                                             </tr>
                    //                                         ))}
                    //                                     </tbody>
                    //                                 </Table>
                    //                             </Col>
                    //                         </Container>
                    //                         :<>
                    //                             Error... no points data found
                    //                         </>
                                            
                    //                     }
                    //                 </Row>
                    //             </Col>
                    //         </Row>
                    //         <Row>
                    //             {
                    //                 (league.races?.length && tableSeries) &&
                    //                 <LineChart
                    //                     // xAxis={[{ data: [1, 2, 3, 5, 8, 10, 12, 15, 16] }]}
                    //                     xAxis={[
                    //                         { 
                    //                             data: league.races.map((r) => lists["tracks"]?.list?.find((t) => t.id === r.track)?.name),
                    //                             scaleType: 'point',
                    //                         }
                    //                     ]}
                    //                     series={tableSeries}
                    //                     height={400}
                    //                     margin={{ top: 100, bottom: 100, right: 250 }}
                    //                     sx= {{
                    //                         [`.${axisClasses.bottom} .${axisClasses.tickLabel}`]: {
                    //                             transform: "rotateZ(-45deg) translate(-50px, 0px)"
                    //                         }
                    //                     }}
                    //                     slotProps={{
                    //                         legend: {
                    //                           position: {
                    //                             vertical: 'middle',
                    //                             horizontal: 'right',
                    //                           },
                    //                           direction: 'column',
                    //                           itemGap: 2,
                    //                         }
                    //                     }}
                    //                     colors={cheerfulFiestaPalette}
                    //                 />
                    //             }
                            
                    //         </Row>
                    //         <hr/>
                    //         <Row>
                    //             {
                    //                 showHistorySpinner &&
                    //                 <div className="text-center mt-4">
                    //                     <Spinner animation="border" role="status"/>
                    //                     <div>
                    //                         Loading Race Results...
                    //                     </div>
                    //                 </div>
                    //             }
                    //             {
                    //                 leagueHistory && 
                    //                 leagueHistory.map((h,i) => 
                    //                     <SessionHistoryEntry key={i} data={h} enums={enums} lists={lists} />
                    //                 )
                    //             }
                    //         </Row>
                    //     </Container>
                    // </>
                )
            }

        </Container>
    )
}
 
export default LeagueDescription;
