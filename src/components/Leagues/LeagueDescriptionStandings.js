import { Table, TableHead, TableBody, TableRow, TableCell, Stack, IconButton, Collapse } from "@mui/material";
import { Tooltip, OverlayTrigger } from "react-bootstrap";
import { Spinner } from "react-bootstrap";
import { LineChart } from '@mui/x-charts/LineChart';
import { axisClasses } from "@mui/x-charts";
import { cheerfulFiestaPalette } from '@mui/x-charts/colorPalettes';
import NameMapper from "../../utils/Classes/NameMapper";
import { useState, useMemo, Fragment } from "react";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Typography } from "@mui/material";
import { BsTrophy, BsFlag, BsStopwatch, BsBarChart, BsAward } from "react-icons/bs";
import styles from "./LeagueDescriptionStandings.module.css";

const CHART_COLORS = cheerfulFiestaPalette('light');
const TABLE_HEIGHT = 400;

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
                            <Box className={styles.statsGroup} sx={{ width: '100%', overflow: 'hidden' }}>
                                <Stack
                                    direction="row"
                                    spacing={{ xs: 1.5, sm: 4 }}
                                    className="mt-2 justify-content-center"
                                    sx={{ flexWrap: 'wrap', justifyContent: 'center', rowGap: 1 }}
                                >
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

const LeagueDescriptionStandings = ({league,tableSeries,leagueDetails,lists,showDetailsSpinner=false}) => {
    const [legendVisible, setLegendVisible] = useState(true);
    const [chartMode, setChartMode] = useState('points'); // 'points' | 'gap'
    const [showAll, setShowAll] = useState(false);
    const [hoveredSeriesId, setHoveredSeriesId] = useState(null);

    const toggleShowAll = () => {
        const next = !showAll;
        setShowAll(next);
        if (next) setLegendVisible(false); // too many lines — auto-hide
        else setLegendVisible(true);       // back to top-6 — auto-show
    };

    const sortedRaces = useMemo(() =>
        (league.races || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date)),
        [league.races]
    );

    const filteredSeries = showAll ? tableSeries : tableSeries.slice(0, 6);

    const displaySeries = useMemo(() => {
        if (chartMode === 'points' || filteredSeries.length === 0) return filteredSeries;
        const numRounds = sortedRaces.length;
        // Leader pts per round from full field so the gap is always correct even when filtering top-6
        const leaderPts = Array.from({ length: numRounds }, (_, i) =>
            Math.max(0, ...tableSeries.map(s => s.data[i] ?? 0))
        );
        return filteredSeries.map(s => ({
            ...s,
            data: s.data.map((pts, i) => pts != null ? (pts ?? 0) - leaderPts[i] : null)
        }));
    }, [chartMode, filteredSeries, sortedRaces.length, tableSeries]);

    const yDomain = useMemo(() => {
        const allVals = displaySeries.flatMap(s => s.data.filter(v => v != null));
        if (!allVals.length) return {};
        return chartMode === 'gap'
            ? { min: Math.min(...allVals), max: 0 }
            : { min: 0, max: Math.max(...allVals) };
    }, [displaySeries, chartMode]);

    const xAxisData = useMemo(() => sortedRaces.map((r, idx, races) => {
        const trackName = NameMapper.fromTrackApiName(
            NameMapper.fromTrackId(r.track, lists["tracks"]?.list) || ''
        ) || `Rd ${idx + 1}`;
        const rDate = new Date(r.date).toDateString();
        const sameDateTrack = races.filter(race =>
            new Date(race.date).toDateString() === rDate && race.track === r.track
        );
        if (sameDateTrack.length > 1) {
            const raceNum = sameDateTrack.indexOf(r) + 1;
            return `${trackName} (${raceNum})`;
        }
        return trackName;
    }), [sortedRaces, lists]);

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
                <div className={styles.chartHeader}>
                    <div className={styles.chartToggleGroup}>
                        <button
                            className={`${styles.chartToggleBtn} ${chartMode === 'points' ? styles.chartToggleBtnActive : ''}`}
                            onClick={() => setChartMode('points')}
                        >Points</button>
                        <button
                            className={`${styles.chartToggleBtn} ${chartMode === 'gap' ? styles.chartToggleBtnActive : ''}`}
                            onClick={() => setChartMode('gap')}
                        >Gap to Leader</button>
                    </div>
                    <div className={styles.chartRightControls}>
                        <button
                            className={`${styles.chartShowAllBtn} ${legendVisible ? styles.chartShowAllBtnActive : ''}`}
                            onClick={() => setLegendVisible(v => !v)}
                            title={legendVisible ? 'Hide legend' : 'Show legend'}
                        >
                            Legend
                        </button>
                        {tableSeries.length > 6 && (
                            <button className={styles.chartShowAllBtn} onClick={toggleShowAll}>
                                {showAll ? 'Top 6 only' : `All ${tableSeries.length}`}
                            </button>
                        )}
                    </div>
                </div>
                <LineChart
                    xAxis={[{
                        data: xAxisData,
                        scaleType: 'point',
                        valueFormatter: (value, context) =>
                            context.location === 'tick'
                                ? value.split(' ')[0]
                                : value
                    }]}
                    yAxis={[{
                        ...yDomain,
                        valueFormatter: (v) => chartMode === 'gap'
                            ? `${v > 0 ? '+' : ''}${v} pts`
                            : `${v} pts`
                    }]}
                    series={displaySeries}
                    height={TABLE_HEIGHT}
                    margin={{ bottom: 100, right: 0 }}
                    sx={{
                        [`.${axisClasses.bottom} .${axisClasses.tickLabel}`]: {
                            transform: "rotateZ(-45deg) translate(-55px, 0px)"
                        }
                    }}
                    slotProps={{ legend: { hidden: true } }}
                    colors={CHART_COLORS}
                    highlightedItem={hoveredSeriesId ? { seriesId: hoveredSeriesId } : null}
                    className="standings-chart"
                />
                {legendVisible && (
                    <div className={styles.chartLegend}>
                        {displaySeries.map((s, i) => (
                            <div
                                key={s.id}
                                className={`${styles.chartLegendItem} ${hoveredSeriesId && hoveredSeriesId !== s.id ? styles.chartLegendItemDimmed : ''}`}
                                onMouseEnter={() => setHoveredSeriesId(s.id)}
                                onMouseLeave={() => setHoveredSeriesId(null)}
                            >
                                <span
                                    className={styles.chartLegendDot}
                                    style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                                />
                                <span className={styles.chartLegendLabel}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                )}
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
                            backgroundColor: 'var(--color-bg-elevated)'
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
    </>);
}
export default LeagueDescriptionStandings;