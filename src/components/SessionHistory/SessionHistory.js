import { useEffect, useState } from "react";
import getAPIData from "../../utils/getAPIData";
import SessionHistoryEntry from "./SessionHistoryEntry";

const SessionHistory = ({ enums, lists }) => {
    const [history,setHistory] = useState([]);

    useEffect(() =>{
        getAPIData('/sms_stats_data/stats/history')
        .then((res) => {
            if( res ){
                //console.log('setting history!')
                setHistory([ ...res ]);
            }
        })
    },[]);

    return (
        <>
            <h3> Session History: </h3>
            {history.filter(h => Object.keys(h.stages) !== 0 && h.stages.race1).map((h) => (
                h && enums && lists? 
                <SessionHistoryEntry data={h} enums={enums} lists={lists}/> : <></>
            ))}
        </>
    );
};
export default SessionHistory;