import { Spinner, Container, Col } from "react-bootstrap";
import SessionHistoryEntry from "../SessionHistory/SessionHistoryEntry";
import NameMapper from "../../utils/Classes/NameMapper";
import { Table, TableHead, TableBody, TableRow, TableCell, Chip } from "@mui/material";

const LeagueDescriptionSchedule = ({showHistorySpinner,leagueHistory,enums,lists,league}) => {
    function dateToDisplayString(dt){
        let dtObj = new Date(dt);

        dtObj.setMinutes(dtObj.getMinutes() + dtObj.getTimezoneOffset());
        return dtObj.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})
    }
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
                            {league.races.map((r,i) => (
                                <TableRow key={i}>
                                    <TableCell>{dateToDisplayString(r.date)}</TableCell>
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
            {
                leagueHistory && 
                <div>
                    <h4>Results</h4>
                    {leagueHistory.sort((a,b) => a.end_time - b.end_time).map((h,i) => 
                        <SessionHistoryEntry key={i} data={h} enums={enums} lists={lists} />
                    )}
                </div>
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