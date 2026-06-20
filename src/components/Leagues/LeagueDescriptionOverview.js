import { Row, Col, ProgressBar, Spinner, Card, Badge, Container } from 'react-bootstrap';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import NameMapper from '../../utils/Classes/NameMapper';
import msToTime from '../../utils/msToTime'
import { BsTrophy, BsFlag, BsSpeedometer, BsClock } from 'react-icons/bs';
import { LuCrown } from "react-icons/lu";
import getAPIData from "../../utils/getAPIData";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from 'recharts';

import styles from './LeagueDescriptionOverview.module.css';

const CHART_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', '#00A8E1', '#4CAF50', '#B07FFF'];

const RACE_TYPE_COLORS = {
    standard:  'var(--color-secondary)',
    feature:   'var(--color-accent)',
    sprint:    'var(--color-success)',
    endurance: 'var(--color-danger)',
};

const RACE_TYPE_LABELS = {
    standard:  'Standard',
    feature:   'Feature',
    sprint:    'Sprint',
    endurance: 'Endurance',
};

const LeagueDescriptionOverview = ({league, standings, lists, leagueHistory, schedule}) => {
    const [completedRaces, setCompletedRaces] = useState([]);
    const [raceResults, setRaceResults] = useState({});
    const [showRecentRacesSpinner, setShowRecentRacesSpinner] = useState(true);
    const nextRace = league?.races.find(race => new Date(race.date) > new Date());
    // Top 6 human drivers for the bar chart
    const topDrivers = (standings || []).filter(d => !d.PlayerName.includes('(AI)')).slice(0, 6);
    const champion = standings?.[0];

    useEffect(() => {
        // All completed races, newest-first (for Recent Results display)
        const sorted = [...leagueHistory]
            .sort((a, b) => b.start_time - a.start_time);
        setCompletedRaces(sorted);
        setShowRecentRacesSpinner(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leagueHistory]);

    useEffect(() => {
        if (completedRaces?.length) {
            const fetchPromises = completedRaces.map(race => {
                return getAPIData(`/api/batchupload/sms_stats_data/results/?stage_id=${race.stages.race1.id}`)
                .then(res => ({ raceId: race.id, results: res }))
                .catch(err => {
                    console.error(`Error fetching results for race ${race.id}:`, err);
                    return { raceId: race.id, results: null };
                });
            });
            Promise.all(fetchPromises).then(resultsArray => {
                const newResults = {};
                resultsArray.forEach(item => { newResults[item.raceId] = item.results; });
                setRaceResults(newResults);
            });
        }
    }, [completedRaces]);
    
    return (
        <div className="league-dashboard">
            {/* Champion Celebration Card - more compact version */}
            {league.completed && champion ? (
                <Card className={`mb-4 ${styles.championCard}`}>
                    <Card.Body className="py-3">
                        <Row className="align-items-center">
                            <Col xs={12} md={4} className="text-center text-md-start mb-3 mb-md-0">
                                <div className="d-flex align-items-center">
                                    <div className={styles.crownIcon}>
                                        <LuCrown size={32} className="text-warning" />
                                    </div>
                                    <div className="ms-3">
                                        <h5 className="mb-0">Season Champion</h5>
                                        <h2 className="mb-0 mt-1">{champion.PlayerName}</h2>
                                    </div>
                                </div>
                            </Col>
                            <Col xs={12} md={3} className="text-center mb-3 mb-md-0">
                                <span className="badge bg-warning text-dark p-2 px-3">
                                    <BsTrophy className="me-2" />
                                    {champion.Points} Points
                                </span>
                            </Col>
                            <Col xs={12} md={5}>
                                <div className={styles.championStatCompact}>
                                    <div className="d-flex justify-content-center">
                                        <div className={styles.statItem}>
                                            <div className={styles.statValue}>{champion.Wins || 0}</div>
                                            <div className={styles.statLabel}>Wins</div>
                                        </div>
                                        <div className={styles.statItem}>
                                            <div className={styles.statValue}>{champion.Podiums || 0}</div>
                                            <div className={styles.statLabel}>Podiums</div>
                                        </div>
                                        <div className={styles.statItem}>
                                            <div className={styles.statValue}>{champion.FastestLaps || 0}</div>
                                            <div className={styles.statLabel}>Fastest Laps</div>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            ) : (
                <Card className={`mb-4 ${styles.dashboardCard}`}>
                <Card.Body>
                    <Card.Title className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <BsTrophy className="text-primary me-2" />
                            <h3 className="d-inline">{league.name}</h3>
                        </div>
                        <Badge bg={!league.completed ? "success" : "secondary"} className="px-3 py-2">
                            {!league.completed ? "Active" : "Completed"}
                        </Badge>
                    </Card.Title>
                    <Card.Text className="lead">{league.description}</Card.Text>
                </Card.Body>
            </Card>
            )
        }

            <Row className="g-4 mb-4">
                <Col md={4}>
                    <Card className={styles.dashboardCard}>
                        <Card.Body>
                            <div className={styles.cardTitle}>
                                <BsFlag className="text-danger" />
                                <h5 className="mb-0">Next Race</h5>
                            </div>
                            {
                                nextRace ? (
                                <div className="text-center mt-3">
                                    <h4 className="text-primary mb-3">
                                        {NameMapper.fromTrackId(nextRace.track,lists["tracks"]?.list)}
                                    </h4>
                                    <div className="mb-2">
                                        <BsClock className="me-2 text-muted" />
                                        {format(new Date(nextRace.date), 'PPP')}
                                    </div>
                                    <div className="text-muted">
                                        Start: {format(new Date(nextRace.date), 'p')} (central)
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted text-center mt-3">No upcoming races</p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                
                <Col md={4}>
                    <Card className={styles.dashboardCard}>
                        <Card.Body>
                            <div className={styles.cardTitle}>
                                <BsTrophy className="text-warning" />
                                <h5 className="mb-0">Championship Leaders</h5>
                            </div>
                            {topDrivers.length > 0 ? (
                                <ResponsiveContainer width="100%" height={160}>
                                    <BarChart
                                        data={topDrivers}
                                        layout="vertical"
                                        margin={{ top: 4, right: 36, left: 4, bottom: 4 }}
                                    >
                                        <XAxis type="number" hide domain={[0, topDrivers[0]?.Points || 1]} />
                                        <YAxis
                                            type="category"
                                            dataKey="PlayerName"
                                            width={80}
                                            tick={{ fontSize: 11 }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            formatter={(v) => [`${v} pts`, 'Points']}
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        />
                                        <Bar dataKey="Points" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11, fontWeight: 700 }}>
                                            {topDrivers.map((_, i) => (
                                                <Cell key={i} fill={CHART_COLORS[i] ?? '#888'} fillOpacity={i === 0 ? 1 : 0.75} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center py-3 text-muted small">
                                    Standings will appear after the first race
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4}>
                    <Card className={styles.dashboardCard}>
                        <Card.Body>
                            <div className={styles.cardTitle}>
                                <BsSpeedometer className="text-primary" />
                                <h5 className="mb-0">League Progress</h5>
                            </div>
                            <div className={styles.progressSection}>
                                <ProgressBar 
                                    now={(league?.races.filter(race => new Date(race.date) < new Date()).length / league?.races.length) * 100} 
                                    className="mb-3"
                                />
                                <div className="text-muted">
                                    {league?.races.filter(race => new Date(race.date) < new Date()).length}/{league?.races.length} Races
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4">
                <Col md={6}>
                    <Card className={styles.dashboardCard}>
                        <Card.Body>
                            <div className={styles.cardTitle}>
                                <BsClock className="text-success" />
                                <h5 className="mb-0">Recent Results</h5>
                            </div>
                            { showRecentRacesSpinner ? (
                                <Container className="text-center p-5">
                                    <Spinner animation="border" role="status" variant="primary"/>
                                    <p className="mt-3 text-muted">Loading results...</p>
                                </Container>
                            ) :
                            completedRaces?.length ? (
                                completedRaces.slice(0, 3).map((race, index) => {
                                    const result = raceResults[race.id];
                                    return (
                                        <div key={race.id} className={`recent-race ${index !== 0 ? 'mt-3 pt-3 border-top' : ''}`}>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <h6 className="mb-0">
                                                    <BsSpeedometer className="me-2 text-primary" />
                                                    {NameMapper.fromTrackApiName(NameMapper.fromTrackId(race.setup.TrackId, lists["tracks"]?.list))}
                                                </h6>
                                                <small className="text-muted">
                                                    {format((new Date(0)).setUTCSeconds(race.start_time), 'MMM d, yyyy')}
                                                </small>
                                            </div>
                                            {result ? (
                                                <>
                                                    <div className={`${styles.winnerHighlight} mt-2`}>
                                                        <BsTrophy className="me-2" />
                                                        {result.find((r) => r.RacePosition === 1)?.name}
                                                        <span className="text-muted ms-2 small">
                                                            ({msToTime(result.find((r) => r.RacePosition === 1)?.FastestLapTime)}s)
                                                        </span>
                                                    </div>
                                                    <div className={`${styles.podiumHighlight} d-flex justify-content-between small text-muted mt-1`}>
                                                        <span>P2: {result.find((r) => r.RacePosition === 2)?.name}</span>
                                                        <span>P3: {result.find((r) => r.RacePosition === 3)?.name}</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-muted mt-2 text-center">
                                                    <small>Results loading...</small>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-4">
                                    <div className="mb-3">
                                        <BsFlag className="text-muted" style={{ fontSize: "1.5rem" }} />
                                    </div>
                                    <p className="text-muted mb-3">No races completed yet</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className={`${styles.dashboardCard} h-100`}>
                        <Card.Body>
                            <div className={styles.cardTitle}>
                                <BsFlag className="text-primary" />
                                <h5 className="mb-0">Season Calendar</h5>
                            </div>
                            {(() => {
                                const sortedSchedule = [...(schedule || league?.races || [])]
                                    .sort((a, b) => new Date(a.date) - new Date(b.date));
                                const sortedCompleted = [...completedRaces]
                                    .sort((a, b) => a.start_time - b.start_time);
                                if (!sortedSchedule.length) return (
                                    <p className="text-muted small mt-2">Schedule not available</p>
                                );

                                // Determine which race types are actually in the schedule for the legend
                                const presentTypes = [...new Set(
                                    sortedSchedule.map(r => r.race_type).filter(Boolean)
                                )].filter(t => RACE_TYPE_LABELS[t]);

                                return (
                                    <>
                                        {presentTypes.length > 1 && (
                                            <div className={styles.calendarLegend}>
                                                {presentTypes.map(t => (
                                                    <span key={t} className={styles.calendarLegendItem}>
                                                        <span
                                                            className={styles.calendarLegendDot}
                                                            style={{ background: RACE_TYPE_COLORS[t] }}
                                                        />
                                                        {RACE_TYPE_LABELS[t]}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <div className={styles.calendarStrip}>
                                            {sortedSchedule.map((race, i) => {
                                                const histEntry = sortedCompleted[i];
                                                const winner = histEntry ? raceResults[histEntry.id]?.find(r => r.RacePosition === 1)?.name : null;
                                                const isDone = !!histEntry;
                                                const rawName = race.track_name ?? NameMapper.fromTrackId(race.track, lists["tracks"]?.list);
                                                const displayName = NameMapper.fromTrackApiName(rawName) ?? rawName ?? `R${i + 1}`;
                                                const shortName = displayName.split(' ').slice(0, 2).join(' ');
                                                const typeColor = RACE_TYPE_COLORS[race.race_type] ?? 'var(--color-border)';
                                                return (
                                                    <div
                                                        key={i}
                                                        className={`${styles.calendarRound} ${isDone ? styles.calendarRoundDone : styles.calendarRoundUpcoming}`}
                                                        style={{ borderLeft: `3px solid ${typeColor}` }}
                                                        title={`${displayName}${race.race_type ? ` · ${RACE_TYPE_LABELS[race.race_type] ?? race.race_type}` : ''}`}
                                                    >
                                                        <div className={styles.calendarRoundNum}>R{i + 1}</div>
                                                        <div className={styles.calendarRoundTrack}>{shortName}</div>
                                                        {isDone && winner && (
                                                            <div className={styles.calendarRoundWinner}>{winner}</div>
                                                        )}
                                                        {isDone && !winner && (
                                                            <div className={styles.calendarRoundWinner}>—</div>
                                                        )}
                                                        {!isDone && (
                                                            <div className={styles.calendarRoundDate}>
                                                                {format(new Date(race.date), 'MMM d')}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                );
                            })()}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default LeagueDescriptionOverview;
