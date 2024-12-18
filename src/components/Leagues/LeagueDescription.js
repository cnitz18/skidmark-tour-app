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
import LeagueDescriptionRules from './LeagueDescriptionRules';
  
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
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
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
    const [tabValue, setTabValue] = React.useState(2);

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
        <div>
            <PageHeader title={league?.name}/>
            {showSpinner ? (

                <div className="text-center mt-4">
                    <Spinner animation="border" role="status"/>
                    <div>
                        One moment please...
                    </div>
                </div>
                ) : 
                ( league &&
                    <Container className="league-desc-container">
                        <Box sx={{ width: '100%' }}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <Tabs 
                                    value={tabValue} 
                                    onChange={handleChange} 
                                    aria-label="basic tabs example" 
                                    variant="scrollable"
                                    scrollButtons="auto">
                                    <Tab label="Overview" {...a11yProps(0)} />
                                    <Tab label="Schedule" {...a11yProps(1)} />
                                    <Tab label="Standings" {...a11yProps(2)} />
                                    <Tab label="Scoring" {...a11yProps(3)}/>
                                </Tabs>
                            </Box>
                            <LeagueDescriptionTabPanel value={tabValue} index={0}>
                                <LeagueDescriptionOverview {...{league}}/>
                            </LeagueDescriptionTabPanel>
                            <LeagueDescriptionTabPanel value={tabValue} index={1}>
                                <LeagueDescriptionSchedule {...{showHistorySpinner,leagueHistory,enums,lists,league}}/>
                            </LeagueDescriptionTabPanel>
                            <LeagueDescriptionTabPanel value={tabValue} index={2}>
                                <LeagueDescriptionStandings {...{league,tableSeries,leagueDetails,lists}}/>
                            </LeagueDescriptionTabPanel>
                            <LeagueDescriptionTabPanel value={tabValue} index={3}>
                                <LeagueDescriptionRules {...{league}}/>
                            </LeagueDescriptionTabPanel>
                        </Box>
                    </Container>
                )
            }
        </div>
    )
}
 
export default LeagueDescription;
