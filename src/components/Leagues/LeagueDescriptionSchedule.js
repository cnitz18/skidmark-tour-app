import { Spinner } from "react-bootstrap";
import SessionHistoryEntry from "../SessionHistory/SessionHistoryEntry";
import NameMapper from "../../utils/Classes/NameMapper";
import { Table, TableHead, TableBody, TableRow, TableCell, Chip } from "@mui/material";
import { format } from 'date-fns';

const LeagueDescriptionSchedule = ({showHistorySpinner,leagueHistory,enums,lists,league}) => {
    return (
        <>
            <h4>Calendar</h4>
            {
                league && league.races?.length ?
                <div className="schedule-table-div">
                    <Table className="text-align-center">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ textAlign:"center"}}><b>Date</b></TableCell>
                                <TableCell sx={{ textAlign:"center"}}><b>Track</b></TableCell>
                                <TableCell sx={{ textAlign:"center"}}><b>Status</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {league.races.sort((a,b) => new Date(a.date) - new Date(b.date)).map((r,i) => (
                                <TableRow key={i}>
                                    <TableCell>{format(new Date(r.date),'PPp')}</TableCell>
                                    <TableCell>{ NameMapper.fromTrackId(r.track,lists["tracks"].list)}</TableCell>
                                    <TableCell>
                                        {
                                            r.completed ? 
                                            <Chip size="small" label="Done" color="success" variant="outlined" className="status-chip"/>
                                            : <Chip size="small" label="Incomplete" color="info" variant="outlined" className="status-chip"/>
                                        }
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                :<>
                    Error... no data found
                </>
                
            }
            <h4>Results</h4>
            {
                !showHistorySpinner && leagueHistory && leagueHistory.length ? 
                <div>
                    {leagueHistory.sort((a,b) => b.end_time - a.end_time).map((h,i) => 
                        <SessionHistoryEntry key={i} data={h} enums={enums} lists={lists} />
                    )}
                </div> : <></>
            }
            {
                showHistorySpinner &&
                <div className="text-center mt-4">
                    <Spinner animation="border" role="status"/>
                    <div>
                        Loading Race Results...
                    </div>
                </div>
            }
        </>
    );
}
export default LeagueDescriptionSchedule;