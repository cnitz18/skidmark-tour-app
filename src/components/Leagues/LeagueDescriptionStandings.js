import { Table, TableHead, TableBody, TableRow, TableCell, Stack, IconButton, Collapse } from "@mui/material";
import { Tooltip, OverlayTrigger } from "react-bootstrap";
import { Spinner } from "react-bootstrap";
import { LineChart } from '@mui/x-charts/LineChart';
import { axisClasses } from "@mui/x-charts";
import NameMapper from "../../utils/Classes/NameMapper";
import { useState, Fragment } from "react";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Typography } from "@mui/material";
import { BsTrophy, BsFlag, BsStopwatch, BsBarChart, BsAward } from "react-icons/bs";
import styles from "./LeagueDescriptionStandings.module.css";

const TABLE_HEIGHT = 420;
const MAX_CHART_DRIVERS = 6;
// Vivid, distinct colors for top contenders
const CHART_COLORS = ['#FFD700', '#00A8E1', '#FF6B6B', '#4CAF50', '#FF9800', '#B07FFF'];

function StandingsRow(props){
    const { ent,arr,i } = props;
    const [openRow, setOpenRow] = useState(false);

    return (
        <Fragment>
            <OverlayTrigger
                key={i}
                placement="right"
                overlay={(props) => (
                    <Tooltip {...props}>
                        <span>More Stats</span>
                    </Tooltip>)}>
                <TableRow key={i} sx={{ '& > *': { borderBottom: 'unset' } }}>
                    <TableCell>{ent.Position === arr[i-1]?.Position ? '' : NameMapper.positionFromNumber(ent.Position)}</TableCell>
                    <TableCell>{ent.PlayerName}</TableCell>
                    <TableCell>{ent.Points}</TableCell>
                    <TableCell>
                        <IconButton
                            aria-label="expand row"
                            size="small"
                            onClick={() => setOpenRow(!openRow)}
                            >
                            {openRow ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                    </TableCell>
                </TableRow>
            </OverlayTrigger>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={openRow} timeout="auto" unmountOnExit>
                            {/* <Typography variant="h6" gutterBottom component="div">
                                Season Statistics
                            </Typography> */}
                            <Box className={styles.statsGroup}>
                                <Stack direction="row" spacing={4} className="mt-2 justify-content-center">
                                    <Box className={styles.statItem}>
                                        <BsTrophy className="text-warning mb-1" />
                                        <Typography variant="h6">{ent.Wins}</Typography>
                                        <Typography variant="body2" color="text.secondary">Wins</Typography>
                                    </Box>
                                    <Box className={styles.statItem}>
                                        <BsFlag className="text-success mb-1" />
                                        <Typography variant="h6">{ent.Poles}</Typography>
                                        <Typography variant="body2" color="text.secondary">Poles</Typography>
                                    </Box>
                                    <Box className={styles.statItem}>
                                        <BsAward className="text-info mb-1" />
                                        <Typography variant="h6">{ent.Podiums}</Typography>
                                        <Typography variant="body2" color="text.secondary">Podiums</Typography>
                                    </Box>
                                    <Box className={styles.statItem}>
                                        <BsStopwatch className="text-primary mb-1" />
                                        <Typography variant="h6">{ent.FastestLaps}</Typography>
                                        <Typography variant="body2" color="text.secondary">Fastest Laps</Typography>
                                    </Box>
                                    <Box className={styles.statItem}>
                                        <BsBarChart className="text-purple mb-1" />
                                        <Typography variant="h6">{ent.PointsFinishes}</Typography>
                                        <Typography variant="body2" color="text.secondary">Points Finishes</Typography>
                                    </Box>
                                </Stack>
                            </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </Fragment>
    );
}

function RoundPositionMatrix({ league, leagueDetails, lists }) {
    const snapshot = leagueDetails?.snapshot;
    const scoreboard = leagueDetails?.scoreboard_entries;
    const schedule = leagueDetails?.schedule;

    if (!snapshot?.length || !scoreboard?.length) return null;

    // Completed rounds only (weeks that appear in snapshot), sorted chronologically
    const rounds = [...new Set(snapshot.map(s => s.Week))].sort((a, b) => a - b);
    if (!rounds.length) return null;

    // All human drivers that appear in the snapshot (for correct per-round ranking)
    const allHumansInSnapshot = [...new Set(
        snapshot.filter(s => !s.PlayerName.includes('(AI)')).map(s => s.PlayerName)
    )];

    // Display rows: top 8 human drivers by final standing
    const displayDrivers = scoreboard
        .filter(e => !e.PlayerName.includes('(AI)'))
        .slice(0, 8)
        .map(e => e.PlayerName);

    if (!displayDrivers.length) return null;

    // Build cumulative points table: cumulative[driver][week] = Points
    const cumulative = {};
    snapshot.forEach(s => {
        if (!cumulative[s.PlayerName]) cumulative[s.PlayerName] = {};
        cumulative[s.PlayerName][s.Week] = s.Points;
    });

    // Per-round points delta for all human drivers
    const delta = {};
    allHumansInSnapshot.forEach(driver => {
        delta[driver] = {};
        rounds.forEach((week, i) => {
            const curr = cumulative[driver]?.[week] ?? (i > 0 ? (cumulative[driver]?.[rounds[i - 1]] ?? 0) : 0);
            const prev = i > 0 ? (cumulative[driver]?.[rounds[i - 1]] ?? 0) : 0;
            delta[driver][week] = curr - prev;
        });
    });

    // Rank all human drivers within each round by delta → approximate finishing position
    const position = {};
    rounds.forEach(week => {
        const scored = allHumansInSnapshot.filter(d => (delta[d]?.[week] ?? 0) > 0);
        scored
            .sort((a, b) => delta[b][week] - delta[a][week])
            .forEach((driver, idx) => {
                if (!position[driver]) position[driver] = {};
                position[driver][week] = idx + 1;
            });
    });

    // Column headers: use schedule sorted by date, index = round - 1
    const sortedSchedule = [...(schedule || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
    const trackLabels = rounds.map((week, i) => {
        const entry = sortedSchedule[i];
        if (!entry) return `R${week}`;
        const fullName = NameMapper.fromTrackApiName(entry.track_name) ?? entry.track_name ?? `R${week}`;
        // Abbreviate: first two meaningful words
        const parts = fullName.split(' ');
        return parts.length > 1 ? `${parts[0]} ${parts[1]}` : parts[0];
    });

    const getCellClass = (pos) => {
        if (!pos) return styles.matrixCellEmpty;
        if (pos === 1) return styles.matrixCellP1;
        if (pos === 2) return styles.matrixCellP2;
        if (pos === 3) return styles.matrixCellP3;
        if (pos <= 8) return styles.matrixCellPoints;
        return styles.matrixCellNoScore;
    };

    return (
        <div className={styles.matrixWrapper}>
            <Typography variant="subtitle2" className={styles.chartTitle}>
                Round-by-Round Results
            </Typography>
            <div className={styles.matrixScroll}>
                <table className={styles.matrixTable}>
                    <thead>
                        <tr>
                            <th className={styles.matrixDriverHeader}></th>
                            {trackLabels.map((label, i) => (
                                <th key={i} className={styles.matrixRoundHeader}>
                                    <span className={styles.matrixRoundLabel}>{label}</span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {displayDrivers.map((driver, di) => (
                            <tr key={di} className={styles.matrixRow}>
                                <td className={styles.matrixDriverCell}>{driver}</td>
                                {rounds.map((week, ri) => {
                                    const pos = position[driver]?.[week] ?? null;
                                    return (
                                        <td key={ri} className={`${styles.matrixCell} ${getCellClass(pos)}`}>
                                            {pos ?? '—'}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const LeagueDescriptionStandings = ({league,tableSeries,leagueDetails,lists,showDetailsSpinner=false}) => {
    // Limit to top contenders to keep the chart legible
    const chartSeries = (tableSeries || []).slice(0, MAX_CHART_DRIVERS).map((s, i) => ({
        ...s,
        showMark: i === 0,   // only the leader gets data-point dots
    }));
    const leaderId = chartSeries[0]?.id;

    return (<>
        {
            showDetailsSpinner && (
                <div className="text-center mt-4">
                    <Spinner animation="border" role="status"/>
                    <div>
                        Loading standings...
                    </div>
                </div>
            )
        }
        {
            (!showDetailsSpinner && league.races?.length && tableSeries?.length > 0) &&
            <Stack>
                <Typography variant="subtitle2" className={styles.chartTitle}>
                    Title Race — Top {Math.min(tableSeries.length, MAX_CHART_DRIVERS)} Drivers
                </Typography>
                <LineChart
                    xAxis={[
                        { 
                            data: league.races
                                    .sort((a,b) => new Date(a.date) - new Date(b.date))
                                    .map((r, idx, races) => {
                                        const rawName = NameMapper.fromTrackId(r.track, lists["tracks"]?.list);
                                        const trackName = NameMapper.fromTrackApiName(rawName) ?? rawName;
                                        const rDate = new Date(r.date).toDateString();
                                        const sameDateTrack = races.filter(race => 
                                            new Date(race.date).toDateString() === rDate && race.track === r.track
                                        );
                                        
                                        if (sameDateTrack.length > 1) {
                                            const raceNum = sameDateTrack.indexOf(r) + 1;
                                            return `${trackName} (${raceNum})`;
                                        }
                                        return trackName;
                                    }),
                            scaleType: 'point',
                        }
                    ]}
                    series={chartSeries}
                    height={TABLE_HEIGHT + 160}
                    margin={{ bottom: 180, right: 20 }}
                    sx={{
                        [`.${axisClasses.bottom} .${axisClasses.tickLabel}`]: {
                            transform: "rotateZ(-45deg) translate(-55px, 0px)"
                        },
                        // Make the leader's line noticeably thicker
                        ...(leaderId ? {
                            [`& .MuiLineElement-series-${CSS.escape(leaderId)}`]: {
                                strokeWidth: '3px',
                            }
                        } : {})
                    }}
                    slotProps={{
                        legend: {
                            position: {
                                vertical: 'bottom',
                                horizontal: 'middle'
                            },
                            direction: 'row',
                            itemMarkWidth: 20,
                            itemMarkHeight: 2,
                            markGap: 5,
                            itemGap: 16,
                            hidden: false
                        }
                    }}
                    colors={CHART_COLORS}
                    className="standings-chart"
                />
            </Stack>
        }
        {
            (!showDetailsSpinner && leagueDetails && leagueDetails?.scoreboard_entries) 
            && 
            <div className="schedule-table-div standings-table-div">
                <Table size="sm" sx={{
                        '& .MuiTableCell-root': {
                            padding: '12px',
                            textAlign: 'center'
                        },
                        '& .MuiTableHead-root': {
                            backgroundColor: '#f5f5f5'
                        }
                    }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ textAlign:"center"}}><b>Position</b></TableCell>
                            <TableCell sx={{ textAlign:"center"}}><b>Name</b></TableCell>
                            <TableCell sx={{ textAlign:"center"}}><b>Points</b></TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                    {
                        leagueDetails.scoreboard_entries.map((ent,i,arr) => (
                            <StandingsRow key={i} {...{ent,i,arr}}/>
                        ))
                    }
                    </TableBody>
                </Table>
            </div>
        }
        {
            (!showDetailsSpinner && leagueDetails?.snapshot?.length > 0) &&
            <RoundPositionMatrix {...{league, leagueDetails, lists}} />
        }
    </>);
}
export default LeagueDescriptionStandings;