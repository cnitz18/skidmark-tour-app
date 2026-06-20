import React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import PageHeader from '../shared/PageHeader';
import getAPIData from '../../utils/getAPIData';
import { useLocation, useParams } from "react-router-dom";
import { Tabs, Tab, Box } from '@mui/material';
import useHorizontalOverflowIndicators from '../../utils/useHorizontalOverflowIndicators';
import LeagueDescriptionOverview from './LeagueDescriptionOverview';
import LeagueDescriptionSchedule from './LeagueDescriptionSchedule';
import LeagueDescriptionStandings from './LeagueDescriptionStandings';
import LeagueDescriptionPerformance from './LeagueDescriptionPerformance';
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
        {value === index && <Box>{children}</Box>}
      </div>
    );
}
  
function a11yProps(index) {
    return {
      id: `league-tab-${index}`,
      'aria-controls': `league-tabpanel-${index}`,
      className: 'league-tab',
    };
}
  

const LeagueDescription = ({ enums, lists }) => {
    const [tabValue, setTabValue] = React.useState(0);
    const [targetRaceId, setTargetRaceId] = React.useState(null);
    const tabsShellRef = useRef(null);
    const getLeagueTabsScroller = useCallback(
        () => tabsShellRef.current?.querySelector('.MuiTabs-scroller'),
        []
    );

    const handleChange = (event, newValue) => {
      setTabValue(newValue);
    };

    const handleSwitchToSchedule = (raceId) => {
      setTargetRaceId(raceId);
      setTabValue(1);
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
    const { canScrollLeft: canScrollLeagueTabsLeft, canScrollRight: canScrollLeagueTabsRight } = useHorizontalOverflowIndicators(
        getLeagueTabsScroller,
        [league?.id, isLeagueLoading, tabValue]
    );

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
                        showMark: false,
                        highlightScope: { fade: 'global', highlight: 'series' }
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

            getAPIData('/api/batchupload/sms_stats_data/?league=' + league.id + '&per_page=100')
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
                <Container className="text-center p-5 motion-fade-in">
                    <Spinner animation="border" role="status" variant="primary"/>
                    <p className="mt-3 text-muted">Loading league...</p>
                </Container>
            ) : 
                ( league &&
                    <Container className="league-desc-container motion-rise-in">
                        <Box sx={{ width: '100%' }}>
                            <Box ref={tabsShellRef} sx={{
                                position: 'relative',
                                mb: 0.5,
                            }}>
                                <Tabs 
                                    value={tabValue} 
                                    onChange={handleChange}
                                    aria-label="league tabs"
                                    variant="scrollable"
                                    scrollButtons={false}
                                    sx={{
                                        minHeight: 0,
                                        borderBottom: 0,
                                        '& .MuiTabs-indicator': { display: 'none' },
                                        '& .MuiTabs-flexContainer': {
                                            gap: '0.4rem',
                                            py: 0.75,
                                        },
                                        '& .MuiTabs-scrollableX': {
                                            scrollbarWidth: 'none',
                                            '&::-webkit-scrollbar': { display: 'none' },
                                        },
                                        '& .MuiTab-root': {
                                            textTransform: 'none',
                                            minWidth: 0,
                                            minHeight: 0,
                                            px: 1.5,
                                            py: 0.6,
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            lineHeight: 1.3,
                                            borderRadius: '20px',
                                            border: '1.5px solid var(--color-border)',
                                            color: 'var(--color-text-secondary)',
                                            transition: 'all 0.15s ease',
                                            letterSpacing: '0.01em',
                                        },
                                        '& .Mui-selected': {
                                            backgroundColor: 'var(--color-accent) !important',
                                            borderColor: 'var(--color-accent) !important',
                                            color: '#0d2240 !important',
                                            fontWeight: 700,
                                        }
                                    }}>
                                    <Tab label="Overview" {...a11yProps(0)} />
                                    <Tab label="Schedule" {...a11yProps(1)} />
                                    <Tab label="Standings" {...a11yProps(2)} />
                                    <Tab label="Driver Stats" {...a11yProps(3)} />
                                    <Tab label="Details" {...a11yProps(4)} />
                                </Tabs>
                                {canScrollLeagueTabsLeft && (
                                    <Box sx={{
                                        position: 'absolute',
                                        left: 5,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        zIndex: 2,
                                        pointerEvents: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '1.05rem',
                                        height: '1.05rem',
                                        borderRadius: '999px',
                                        backgroundColor: 'rgba(247, 168, 0, 0.22)',
                                        color: 'var(--color-accent)',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        lineHeight: 1,
                                        textShadow: '0 0 8px rgba(247, 168, 0, 0.35)',
                                    }}>
                                        {'<'}
                                    </Box>
                                )}
                                {canScrollLeagueTabsRight && (
                                    <Box sx={{
                                        position: 'absolute',
                                        right: 5,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        zIndex: 2,
                                        pointerEvents: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '1.05rem',
                                        height: '1.05rem',
                                        borderRadius: '999px',
                                        backgroundColor: 'rgba(247, 168, 0, 0.22)',
                                        color: 'var(--color-accent)',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        lineHeight: 1,
                                        textShadow: '0 0 8px rgba(247, 168, 0, 0.35)',
                                    }}>
                                        {'>'}
                                    </Box>
                                )}
                            </Box>
                            <LeagueDescriptionTabPanel value={tabValue} index={0}>
                                <LeagueDescriptionOverview {...{league, standings: leagueDetails.scoreboard_entries, lists, leagueHistory, schedule: leagueDetails.schedule}}/>
                            </LeagueDescriptionTabPanel>
                            <LeagueDescriptionTabPanel value={tabValue} index={1}>
                                <LeagueDescriptionSchedule {...{showHistorySpinner,leagueHistory,enums,lists,league, targetRaceId, onClearTarget: () => setTargetRaceId(null), onSwitchToSchedule: handleSwitchToSchedule}}/>
                            </LeagueDescriptionTabPanel>
                            <LeagueDescriptionTabPanel value={tabValue} index={2}>
                                <LeagueDescriptionStandings {...{league,tableSeries,leagueDetails,lists,showDetailsSpinner: isDetailsLoading}}/>
                            </LeagueDescriptionTabPanel>
                            <LeagueDescriptionTabPanel value={tabValue} index={3}>
                                <LeagueDescriptionPerformance {...{showHistorySpinner,league, leagueHistory, leagueDetails, lists}} />
                            </LeagueDescriptionTabPanel>
                            <LeagueDescriptionTabPanel value={tabValue} index={4}>
                                <LeagueDescriptionRules {...{league, lists}} />
                            </LeagueDescriptionTabPanel>
                        </Box>
                    </Container>
                )
            }
        </Container>
    )
}
 
export default LeagueDescription;
