import { Table, TableHead, TableBody, TableRow, TableCell,Switch, FormControlLabel, Stack, IconButton, Collapse } from "@mui/material";
import { Tooltip, OverlayTrigger, Row, Col, Card } from "react-bootstrap";
import { LineChart } from '@mui/x-charts/LineChart';
import { axisClasses } from "@mui/x-charts";
import { cheerfulFiestaPalette } from '@mui/x-charts/colorPalettes';
import NameMapper from "../../utils/Classes/NameMapper";
import { useState, Fragment } from "react";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

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
                        <Card>
                            <Card.Header>Season Stats</Card.Header>
                            <Card.Body>
                                <Row>
                                <Col>
                                    <Card>
                                        <Card.Header>Race Wins</Card.Header>
                                        <Card.Body>
                                            <Card.Title>{ent.Wins}</Card.Title>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col>
                                    <Card>
                                        <Card.Header>Pole Positions</Card.Header>
                                        <Card.Body>
                                            <Card.Title>{ent.Poles}</Card.Title>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col>
                                    <Card>
                                        <Card.Header>Podiums</Card.Header>
                                        <Card.Body>
                                            <Card.Title>{ent.Podiums}</Card.Title>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col>
                                    <Card>
                                        <Card.Header>Fastest Laps</Card.Header>
                                        <Card.Body>
                                            <Card.Title>{ent.FastestLaps}</Card.Title>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col>
                                    <Card>
                                        <Card.Header>Points Finishes</Card.Header>
                                        <Card.Body>
                                            <Card.Title>{ent.PointsFinishes}</Card.Title>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Collapse>
                </TableCell>
            </TableRow> 
        </Fragment>
    );
}

const LeagueDescriptionStandings = ({league,tableSeries,leagueDetails,lists}) => {
    const [isHidden, setIsHidden] = useState(true);

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
                            transform: "rotateZ(-45deg) translate(-55px, 0px)"
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