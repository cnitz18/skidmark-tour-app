import { useEffect, useState } from "react";
import PlayerStatsEntry from "./PlayerStatsEntry";
import getAPIData from "../../utils/getAPIData";

const PlayerStats = ({ lists }) => {
  const [stats, setStats] = useState({});

  useEffect(() => {
    getAPIData("/sms_stats_data/stats/players").then((res) => {
      if (res) {
        //console.log('setting player stats!')
        setStats({ ...res });
      }
    });
  }, []);
  return (
    <>
      {Object.keys(stats).length ? (
        Object.keys(stats)
          .sort((a, b) => stats[b].last_joined - stats[a].last_joined)
          .map((p) => <PlayerStatsEntry player={stats[p]} lists={lists} />)
      ) : (
        <></>
      )}
    </>
  );
};
export default PlayerStats;
