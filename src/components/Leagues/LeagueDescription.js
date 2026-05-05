import React from 'react'
import { useEffect, useState } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import PageHeader from '../shared/PageHeader';
import getAPIData from '../../utils/getAPIData';
import { useLocation, useParams } from "react-router-dom";
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
    const [isLeagueLoading, setIsLeagueLoading] = useState(true);
    const [isDetailsLoading, setIsDetailsLoading] = useState(true);
    const [showHistorySpinner, setShowHistorySpinner] = useState(true);
    const [league, setLeague] = useState({});
    const [leagueDetails, setLeagueDetails] = useState({});
    const [leagueHistory, setLeagueHistory] = useState([])
    const [tableSeries, setTableSeries] = useState([])
    const { state } = useLocation();
    const { id: routeLeagueId } = useParams();

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
        let isMounted = true;

        const resolveLeague = async () => {
            setIsLeagueLoading(true);

            try {
                if (state?.league) {
                    if (isMounted) {
                        setLeague({ ...state.league });
                        setIsLeagueLoading(false);
                    }
                    return;
                }

                const leagueId = state?.leagueId || routeLeagueId;
                const res = await getAPIData('/leagues/get/?id=' + leagueId);

                if (isMounted) {
                    setLeague({ ...res });
                    setIsLeagueLoading(false);
                }
            } catch (err) {
                console.error('Error fetching league info:', err);
                if (isMounted) {
                    setLeague({});
                    setIsLeagueLoading(false);
                }
            }
        };

        resolveLeague();

        return () => {
            isMounted = false;
        };
        // eslint-disable-next-line
    }, [routeLeagueId, state?.league, state?.leagueId])

    useEffect(() => {
        if( league && league.id ){
            setIsDetailsLoading(true);
            setShowHistorySpinner(true);

            getAPIData('/leagues/get/stats/?id=' + league.id)
            .then((res) => {
                setLeagueDetails({...res})
            }).catch((err) => {
                console.error(err);
                setLeagueDetails({});
            }).finally(() => {
                setIsDetailsLoading(false);
            })

            getAPIData('/api/batchupload/sms_stats_data/?league=' + league.id)
            .then((res) => {
                setLeagueHistory([...res.data])
            }).catch((err) => {
                console.error(err);
                setLeagueHistory([]);
            }).finally(() => {
                setShowHistorySpinner(false)
            })
        }
    },[league])

    return (
        <Container>
            <PageHeader title={league?.name}/>
            {isLeagueLoading ? (
                <Container className="text-center p-5">
                    <Spinner animation="border" role="status" variant="primary"/>
                    <p className="mt-3 text-muted">Loading league...</p>
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
                                <LeagueDescriptionStandings {...{league,tableSeries,leagueDetails,lists,showDetailsSpinner: isDetailsLoading}}/>
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
