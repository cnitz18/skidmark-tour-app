import { useEffect, useState } from "react";
import getAPIData from "../../utils/getAPIData";
import SessionHistoryEntry from "./SessionHistoryEntry";
import PageHeader from "../shared/NewServerSetupPageHeader";

const SessionHistory = ({ enums, lists }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    getAPIData("/api/batchupload/sms_stats_data/").then((res) => {
      if (res) {
        console.log('setting history!',res)
        console.log(res[0]._id)
        console.log('enums!',enums)
        console.log('lists!',lists)
        setHistory([...res]);
        
      }
    });
  }, [enums,lists]);

  return (
    <>
      <PageHeader title="Session History" />
      {
        history && enums && lists ?
        history
        .map((h, i) => 
          
            <SessionHistoryEntry key={h._id} data={h} enums={enums} lists={lists} />
        ) : <></>
      }
    </>
  );
};
export default SessionHistory;
