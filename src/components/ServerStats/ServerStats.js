import { useEffect, useState } from "react";
import getAPIData from "../../utils/getAPIData";
import { Card, Table } from "react-bootstrap";

const ServerStats = ({ lists }) => {
    const [serverStats,setServerStats] = useState({});
    const [sessionStats,setSessionStats] = useState({});
    const [topTracks,setTopTracks] = useState([]);
    const [topCars,setTopCars] = useState([]);

    useEffect(() =>{
        getAPIData('/sms_stats_data/stats/server')
        .then((res) => {
            if( res ){
                //console.log('setting server stats!')
                setServerStats({ ...res });
            }
        })
        .then(() => getAPIData('/sms_stats_data/stats/session'))
        .then((res) => {
            if( res) {
                //console.log('setting session stats!');
                setSessionStats({ ...res });
                if( Object.keys(lists).length ) {
                    ['track_distances','vehicle_distances'].forEach((type) => {
                        let ranks = [
                            {
                                dist: 0, id: '', name: ''
                            },
                            {
                                dist: 0, id: '', name: ''
                            },
                            {
                                dist: 0, id : '', name: ''
                            }
                        ];
                        let list = type === 'track_distances' ? lists.tracks.list : lists.vehicles.list;
                        //console.log('list:',list)
                        for( let id in res.counts[type] ){
                            let dist = res.counts[type][id];
                            let name = list.find(i => i.id === parseInt(id)).name;
                            if( dist > ranks[0].dist ){
                                ranks[2] = { ...ranks[1] };
                                ranks[1] = { ...ranks[0] }
                                ranks[0] = {
                                    dist, id, name : name
                                }
                                if( type === 'track_distances')
                                    ranks[0].races = res.counts['tracks'][id];
                            }else if( dist > ranks[1].dist ){
                                ranks[2] = { ...ranks[1]}
                                ranks[1] = {
                                    dist, id, name : name
                                }
                                if( type === 'track_distances')
                                    ranks[1].races = res.counts['tracks'][id];
                            }else if( dist > ranks[2].dist ){
                                ranks[2] = {
                                    dist, id, name : name
                                }
                                if( type === 'track_distances')
                                    ranks[2].races = res.counts['tracks'][id];
                            }
                        }
                        if( type === 'track_distances' )
                            setTopTracks([ ...ranks ])
                        else
                            setTopCars([ ...ranks ])
                    });

                }
            }
        })
    },[lists]);
    return (
        <>
            <Card>
                <Card.Header as="h4">Server Statistics:</Card.Header>
                <Card.Body>
                    <div class="setup">
                        <div>
                            <h5>Top Tracks:</h5>
                            <Table striped bordered hover>
                                <tbody>
                                    {
                                        topTracks.length ? 
                                        topTracks.map((t) =>(
                                            <tr>
                                                <td>
                                                    {t.name}
                                                </td>
                                                <td>
                                                    {"(" + t.dist + " meters, " + t.races + (t.races === 1 ? " race)" : " races)")}
                                                </td>
                                            </tr>
                                        ))
                                        :<></>
                                    }
                                </tbody>
                            </Table>
                        </div>
                        <div>
                            <h5>Top Cars:</h5>
                            <Table striped bordered hover>
                                <tbody>
                                    {
                                        topCars.length ? 
                                        topCars.map((t) =>(
                                            <tr>
                                                <td>
                                                    {t.name}
                                                </td>
                                                <td>
                                                    {"(" + t.dist + " meters driven)"}
                                                </td>
                                            </tr>
                                        ))
                                        :<></>
                                    }
                                </tbody>
                            </Table>
                        </div>
                    </div>
                    <div class="setup">
                        <div>
                            {
                                sessionStats && sessionStats.counts ? 
                                <label>
                                    Races Started:
                                    <p>{sessionStats.counts.race_loads}</p>
                                </label>
                                : <></>
                            }
                        </div>
                        <div>
                            {
                                sessionStats && sessionStats.counts ? 
                                <label>
                                    Races Finished:
                                    <p>{sessionStats.counts.race_finishes}</p>
                                </label>
                                :<></>
                            }
                        </div>
                        <div>
                            {
                                serverStats ? 
                                <label>
                                    Current Uptime (in seconds): 
                                    <p>{serverStats.uptime}</p>
                                </label>
                                :<></>
                            }
                        </div>
                        <div>
                            {
                                serverStats ? 
                                <label>
                                    Total Uptime (in seconds): 
                                    <p>{serverStats.total_uptime}</p>
                                </label>
                                :<></>
                            }
                        </div>
                    </div>
                    
                </Card.Body>
            </Card>
        </>
    );
};
export default ServerStats;