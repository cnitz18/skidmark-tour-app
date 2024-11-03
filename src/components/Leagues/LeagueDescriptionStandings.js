import { Table, TableHead, TableBody, TableRow, TableCell,Switch, FormControlLabel, Stack, IconButton } from "@mui/material";
import { Tooltip, OverlayTrigger, Row, Container } from "react-bootstrap";
import { LineChart } from '@mui/x-charts/LineChart';
import { axisClasses } from "@mui/x-charts";
import { cheerfulFiestaPalette } from '@mui/x-charts/colorPalettes';
import NameMapper from "../../utils/Classes/NameMapper";
import { useState } from "react";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const LeagueDescriptionStandings = ({league,tableSeries,leagueDetails,lists}) => {
    const [isHidden, setIsHidden] = useState(true);
    const [openRow, setOpenRow] = useState(false);

    return (<>
        {
            (league.races?.length && tableSeries) &&
            <Stack>
                <h4 className="standings-header">Points Race</h4>
                <LineChart
                    xAxis={[
                        { 
                            data: league.races.map((r) => NameMapper.fromTrackId(r.track,lists["tracks"]?.list)),
                            scaleType: 'point',
                        }
                    ]}
                    series={tableSeries}
                    height={400}
                    margin={{ bottom: 100, right: !isHidden ? 250 : 0 }}
                    sx= {{
                        [`.${axisClasses.bottom} .${axisClasses.tickLabel}`]: {
                            transform: "rotateZ(-70deg) translate(-55px, 0px)"
                        }
                    }}
                    slotProps={{
                        legend: {
                            position: {
                                vertical: 'bottom',
                                horizontal: 'right',
                            },
                            direction: 'column',
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
                <div className="legend-checkbox">
                    <FormControlLabel 
                        label="Show Legend"
                        control={
                            <Switch 
                                onChange={(event) => setIsHidden(!event.target.checked)} />
                        } 
                        className="legend-checkbox"/>
                </div>
            </Stack>
        }
        {
            (leagueDetails && leagueDetails?.scoreboard_entries) 
            && 
            <div className="schedule-table-div standings-table-div">
                <Table size="sm">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ textAlign:"center"}}><b>Position</b></TableCell>
                            <TableCell sx={{ textAlign:"center"}}><b>Name</b></TableCell>
                            <TableCell sx={{ textAlign:"center"}}><b>Points</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                    {
                        leagueDetails.scoreboard_entries.map((ent,i,arr) => (
                            <OverlayTrigger
                                key={i}
                                placement="right"
                                overlay={(props) => (
                                    <Tooltip {...props} className="text-left">
                                    <span>
                                        Races Won: { ent.Wins }
                                        <br/>
                                        Pole Positions: { ent.Poles }
                                        <br/>
                                        Fastest Laps: { ent.FastestLaps }
                                        <br/>
                                        Podium Finishes: { ent.Podiums }
                                        <br/>
                                        Points Finishes: { ent.PointsFinishes }
                                    </span>
                                    </Tooltip>
                                )}
                            >
                                <TableRow key={i}>
                                    <TableCell>{ent.Position === arr[i-1]?.Position ? '' : NameMapper.positionFromNumber(ent.Position)}</TableCell>
                                    <TableCell>{ent.PlayerName}</TableCell>
                                    <TableCell>{ent.Points}</TableCell>
                                    <IconButton
                                        aria-label="expand row"
                                        size="small"
                                        onClick={() => setOpenRow(!openRow)}
                                    >
                                        {openRow ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                    </IconButton>
                                </TableRow>
                            </OverlayTrigger>
                        ))
                    }
                    </TableBody>
                </Table>
            </div>
        }
    </>);
}
export default LeagueDescriptionStandings;