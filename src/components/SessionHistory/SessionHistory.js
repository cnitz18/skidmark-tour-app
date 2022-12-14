import { useEffect, useState } from "react";
import getAPIData from "../../utils/getAPIData";
import SessionHistoryEntry from "./SessionHistoryEntry";

const SessionHistory = ({ enums, lists }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    getAPIData("/sms_stats_data/stats/history").then((res) => {
      if (res) {
        //console.log('setting history!')
        setHistory([...res]);
      }
    });
  }, [lists]);

  return (
    <>
      <h3> Session History: </h3>
      {history
        .filter((h) => Object.keys(h.stages) !== 0 && h.stages.race1)
        .map((h, i) =>
          h && enums && lists ? (
            <SessionHistoryEntry key={i} data={h} enums={enums} lists={lists} />
          ) : (
            <></>
          )
        )}
    </>
  );
};
export default SessionHistory;
