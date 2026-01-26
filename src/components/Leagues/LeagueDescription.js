import React from 'react'
import { useEffect, useState } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import PageHeader from '../shared/PageHeader';
import getAPIData from '../../utils/getAPIData';
import { useLocation } from "react-router-dom";
import { Tabs, Tab, Box } from '@mui/material';
import LeagueDescriptionOverview from './LeagueDescriptionOverview';
import LeagueDescriptionSchedule from './LeagueDescriptionSchedule';
import LeagueDescriptionStandings from './LeagueDescriptionStandings';
import LeagueDescriptionPerformance from './LeagueDescriptionPerformance';
  
function LeagueDescriptionTabPanel(props) {
    const { children, value, index, ...other } = props;
  
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`league-tabpanel-${index}`}
        aria-labelledby={`league-tab-${index}`}
        {...other}
      >
        {value === index && <Box>{children}</Box>}
      </div>
    );
}
  
function a11yProps(index) {
    return {
      id: `league-tab-${index}`,
      'aria-controls': `league-tabpanel-${index}`,
    };
}
  

const LeagueDescription = ({ enums, lists }) => {
    const [tabValue, setTabValue] = React.useState(0);

    const handleChange = (event, newValue) => {
      setTabValue(newValue);
    };
    const [showSpinner, setShowSpinner] = useState(true);
    const [showHistorySpinner, setShowHistorySpinner] = useState(true);
    const [league, setLeague] = useState({});
    const [leagueDetails, setLeagueDetails] = useState({});
    const [leagueHistory, setLeagueHistory] = useState([])
    const [tableSeries, setTableSeries] = useState([])
    const { state } = useLocation();

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
                        showMark: false
                    }
                }
                series_obj[snap.PlayerName].data[snap.Week-1] = snap.Points;
            }
            // Sort results by final points value
            setTableSeries([...Object.values(series_obj).filter((a) => a.data.find((ent) => ent > 0)).sort((a,b) => b.data[b.data.length-1] - a.data[a.data.length-1])])
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
                setLeagueDetails({...res})
                setShowSpinner(false)
            }).catch((err) => { console.error(err); setShowSpinner(false) })
            getAPIData('/api/batchupload/sms_stats_data/?league=' + league.id)
            .then((res) => {
                setLeagueHistory([...res.data])
                setShowHistorySpinner(false)
            }).catch((err) => { console.error(err); setShowHistorySpinner(false) })
        }
    },[league])
    return (
        <Container>
            <PageHeader title={league?.name}/>
            {showSpinner ? (
                <Container className="text-center p-5">
                    <Spinner animation="border" role="status" variant="primary"/>
                    <p className="mt-3 text-muted">Loading league details...</p>
                </Container>
            ) : 
                ( league &&
                    <Container className="league-desc-container">
                        <Box sx={{ width: '100%' }}>
                            <Box>
                                <Tabs 
                                    value={tabValue} 
                                    onChange={handleChange}
                                    aria-label="league tabs"
                                    variant="scrollable"
                                    scrollButtons="auto"
                                    sx={{
                                        borderBottom: 1,
                                        borderColor: 'divider',
                                        '& .MuiTab-root': {
                                            textTransform: 'none',
                                            minWidth: 120,
                                            fontWeight: 500
                                        }
                                    }}>
                                    <Tab label="Overview" {...a11yProps(0)} />
                                    <Tab label="Schedule" {...a11yProps(1)} />
                                    <Tab label="Standings" {...a11yProps(2)} />
                                    <Tab label="Performance Analytics" {...a11yProps(3)} />
                                    {/* <Tab label="Scoring" {...a11yProps(3)}/> */}
                                </Tabs>
                            </Box>
                            <LeagueDescriptionTabPanel value={tabValue} index={0}>
                                <LeagueDescriptionOverview {...{league, standings: leagueDetails.scoreboard_entries,lists,leagueHistory}}/>
                            </LeagueDescriptionTabPanel>
                            <LeagueDescriptionTabPanel value={tabValue} index={1}>
                                <LeagueDescriptionSchedule {...{showHistorySpinner,leagueHistory,enums,lists,league}}/>
                            </LeagueDescriptionTabPanel>
                            <LeagueDescriptionTabPanel value={tabValue} index={2}>
                                <LeagueDescriptionStandings {...{league,tableSeries,leagueDetails,lists}}/>
                            </LeagueDescriptionTabPanel>
                            <LeagueDescriptionTabPanel value={tabValue} index={3}>
                                <LeagueDescriptionPerformance {...{showHistorySpinner,league, leagueHistory, leagueDetails, lists}} />
                            </LeagueDescriptionTabPanel>
                        </Box>
                    </Container>
                )
            }
        </Container>
    )
}
 
export default LeagueDescription;
