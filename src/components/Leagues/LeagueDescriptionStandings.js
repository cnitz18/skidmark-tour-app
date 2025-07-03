import { Table, TableHead, TableBody, TableRow, TableCell, Stack, IconButton, Collapse } from "@mui/material";
import { Tooltip, OverlayTrigger } from "react-bootstrap";
import { LineChart } from '@mui/x-charts/LineChart';
import { axisClasses } from "@mui/x-charts";
import { cheerfulFiestaPalette } from '@mui/x-charts/colorPalettes';
import NameMapper from "../../utils/Classes/NameMapper";
import { useState, Fragment } from "react";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Typography } from "@mui/material";
import { BsTrophy, BsFlag, BsStopwatch, BsBarChart, BsAward } from "react-icons/bs";
import styles from "./LeagueDescriptionStandings.module.css";

const TABLE_HEIGHT = 400;
const TABLE_MARGIN = 250;

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

const LeagueDescriptionStandings = ({league,tableSeries,leagueDetails,lists}) => {
    const [isHidden] = useState(true);

    return (<>
        {
            (league.races?.length && tableSeries) &&
            <Stack>
                <LineChart
                
                    xAxis={[
                        { 
                            data: league.races
                                    .sort((a,b) => new Date(a.date) - new Date(b.date))
                                    .map((r) => NameMapper.fromTrackId(r.track,lists["tracks"]?.list)),
                            scaleType: 'point',
                        }
                    ]}
                    series={tableSeries}
                    height={ isHidden ? TABLE_HEIGHT : TABLE_HEIGHT + TABLE_MARGIN }
                    margin={{ bottom: !isHidden ? TABLE_MARGIN + 100 : 100, right: 0 }}
                    sx= {{
                        [`.${axisClasses.bottom} .${axisClasses.tickLabel}`]: {
                            transform: "rotateZ(-45deg) translate(-55px, 0px)"
                        }
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
                            itemGap: 10,
                            hidden: isHidden
                        }
                    }}
                    colors={cheerfulFiestaPalette}
                    className="standings-chart"
                />
                {/* <div className="legend-checkbox">
                    <FormControlLabel 
                        label="Show Legend"
                        control={
                            <Switch 
                                onChange={(event) => setIsHidden(!event.target.checked)} />
                        } 
                        className="legend-checkbox"/>
                </div> */}
                {/* <h4 className="standings-header">Points Race</h4> */}
            </Stack>
        }
        {
            (leagueDetails && leagueDetails?.scoreboard_entries) 
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
    </>);
}
export default LeagueDescriptionStandings;