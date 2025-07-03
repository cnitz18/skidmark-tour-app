import { useEffect, useState } from "react";
import PlayerStatsEntry from "./PlayerStatsEntry";
import getAPIData from "../../utils/getAPIData";

const PlayerStats = ({ lists }) => {
  const [stats, setStats] = useState({});

  useEffect(() => {
    getAPIData("/sms_stats_data/stats/players").then((res) => {
      if (res) {
        setStats({ ...res });
      }
    });
  }, [lists]);
  return (
    <>
      {Object.keys(stats).length ? (
        Object.keys(stats)
          .sort(
            (a, b) => stats[b].counts.race_joins - stats[a].counts.race_joins
          )
          .map((p, i) => (
            <PlayerStatsEntry player={stats[p]} lists={lists} key={i} />
          ))
      ) : (
        <></>
      )}
    </>
  );
};
export default PlayerStats;
