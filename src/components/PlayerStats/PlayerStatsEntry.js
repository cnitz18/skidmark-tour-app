/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { Accordion } from "react-bootstrap";

const PlayerStatsEntry = ({ player, lists }) => {
  const [raceWins, setRaceWins] = useState(0);
  const [polePositions, setPolePositions] = useState(0);
  const [favTrack, setFavTrack] = useState(0);
  const [favCar, setFavCar] = useState(0);

  let calculateAverage = (positions) => {
    let sumPosition = 0;
    let numRaces = 0;
    for (let pos in positions) {
      sumPosition += positions[pos] * parseInt(pos);
      numRaces += positions[pos];
    }
    return sumPosition ? (sumPosition / numRaces).toFixed(2) : 0;
  };
  let getFavorites = () => {
    ["track_distances", "vehicle_distances"].forEach((type) => {
      let curMax = 0;
      let curFavorite = 0;
      for (let id in player.counts[type]) {
        let dist = player.counts[type][id];
        if (dist > curMax) {
          curFavorite = id;
          curMax = dist;
        }
      }
      if (type === "track_distances") setFavTrack(curFavorite);
      else setFavCar(curFavorite);
    });
  };
  useEffect(() => {
    getFavorites();
    setRaceWins(player.counts?.race?.positions[1] ?? 0);
    setPolePositions(player.counts?.qualify?.positions[1] ?? 0);
  }, [player]);

  return (
    <Accordion>
      <div className="history-entry">
        <div className="history-entry-data">
          <div>
            <h5>{player.name}</h5>
          </div>
          <div></div>
          <div>
            <span>Last Joined: </span>
            <span>{new Date(player.last_joined * 1000).toLocaleString()}</span>
          </div>
          <div>{}</div>
        </div>
        <Accordion.Item eventKey="0">
          <Accordion.Header>Details:</Accordion.Header>
          <Accordion.Body>
            <div className="setup">
              {Object.keys(lists).length &&
              lists["vehicles"] &&
              lists["tracks"] ? (
                <>
                  <p>Race Wins: {raceWins}</p>
                  <p>Pole Positions: {polePositions}</p>
                  <p>Races Joined: {player.counts.race_joins}</p>
                  <p>
                    Races Finished: {player.counts.race.states.finished ?? 0}
                  </p>
                  <p>Races Retired: {player.counts.race.states.retired ?? 0}</p>
                  <p>Race DNFs: {player.counts.race.states.dnf ?? 0}</p>
                  <p>
                    Average Race Position:{" "}
                    {calculateAverage(player.counts.race.positions)}
                  </p>
                  <p>
                    Average Qualifying Position:{" "}
                    {calculateAverage(player.counts.qualify.positions)}
                  </p>
                  <p>
                    Favorite Car:{" "}
                    {lists["vehicles"].list.find((v) => v.id === favCar)?.name}
                  </p>
                  <p>
                    Favorite Track:{" "}
                    {lists["tracks"].list.find((v) => v.id === favTrack)?.name}
                  </p>
                </>
              ) : (
                <></>
              )}
            </div>
          </Accordion.Body>
        </Accordion.Item>
      </div>
    </Accordion>
  );
};
export default PlayerStatsEntry;
