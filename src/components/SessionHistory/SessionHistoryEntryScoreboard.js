import { useState, useEffect } from "react";
import { Table } from "react-bootstrap";

const SessionHistoryEntryScoreboard = ({ race, vehicles }) => {
  function convertTimeNumber(num) {
    let totalSeconds = Math.floor(num / 1000);
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds - minutes * 60;
    let decimals = num % 1000;
    let str = num.toString();
    let len = str.length;
    if (str === "0") return "(N/A)";
    let outputString = `${minutes}:${
      seconds / 10 < 1 ? "0" + seconds : seconds
    }:${decimals}`;
    //console.log('num:',num,'outputString:',outputString)
    return outputString;
  }
  useEffect(() => {}, [race]);
  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>Finish Position</th>
          <th>Name</th>
          <th>Vehicle</th>
          <th>Time</th>
          <th>Fastest Lap</th>
        </tr>
      </thead>
      <tbody>
        {race && race.results && race.results.length ? (
          race.results.map((res, i) => (
            <tr key={i}>
              <td>{res.attributes.RacePosition}</td>
              <td>{res.name}</td>
              <td>
                {vehicles.find((v) => v.id === res.attributes.VehicleId).name}
              </td>
              <td>{convertTimeNumber(res.attributes.TotalTime)}</td>
              <td>{convertTimeNumber(res.attributes.FastestLapTime)}</td>
            </tr>
          ))
        ) : (
          <></>
        )}
      </tbody>
    </Table>
  );
};

export default SessionHistoryEntryScoreboard;
