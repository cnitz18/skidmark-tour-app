/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { Accordion, Button, Row, Col } from "react-bootstrap";
import { ImTrophy } from "react-icons/im";
import SessionHistoryEntryScoreboard from "./SessionHistoryEntryScoreboard";

const SessionHistoryEntry = ({ data, enums, lists }) => {
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [raceOne, setRaceOne] = useState();
  const [firstPlace, setFirstPlace] = useState("");
  const [secondPlace, setSecondPlace] = useState("");
  const [thirdPlace, setThirdPlace] = useState("");
  const [sessionFlags, setSessionFlags] = useState(0);
  const [sessionFlagToggles, setSessionFlagToggles] = useState({});
  const [sessionLength, setSessionLength] = useState(0);
  const [timedSession, setTimedSession] = useState(false);

  useEffect(() => {
    setStartTime(new Date(data.start_time * 1000));
    setEndTime(new Date(data.end_time * 1000));

    let race1 = data?.stages?.race1;
    if (race1 && race1?.results?.length) {
      setFirstPlace({
        ...race1?.results?.find((m) => m.attributes?.RacePosition === 1),
      });
      setSecondPlace({
        ...race1?.results?.find((m) => m.attributes?.RacePosition === 2),
      });
      setThirdPlace({
        ...race1?.results?.find((m) => m.attributes?.RacePosition === 3),
      });
    }
    let raceSetup = data?.setup;
    if (raceSetup) {
      setSessionFlags(raceSetup.Flags);
      let curValue = raceSetup.Flags;
      let flagStatus = {};
      // console.log('lists?',lists)
      let flagInfo = lists?.flags?.session?.list;
      if (flagInfo) {
        flagInfo
          .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
          .forEach((f) => {
            flagStatus[f.name] = { checked: false, ...f };
            //console.log("mathing... field", f.name,'value:', f.value,'curValue:', curValue, 'after subtracting:', curValue - f.value);

            if (
              (curValue - f.value >= 0 && f.name !== "COOLDOWNLAP") ||
              (f.name === "COOLDOWNLAP" && curValue < 0)
            ) {
              //console.log('CHECKED:',f.name,f.value)
              curValue -= f.value;
              flagStatus[f.name].checked = true;
            }
          });
      }
      //console.log('flagStatuses:',flagStatus)
      setTimedSession(flagStatus?.TIMED_RACE?.checked);
      setSessionLength(raceSetup.RaceLength);
    }
  }, [data]);
  return (
    <Accordion>
      <div className="history-entry">
        <div className="history-entry-data">
          <div>
            {lists["tracks"] ? (
              <h5>
                {lists["tracks"]?.list?.find((t) => t.id === data.setup.TrackId)
                  ?.name ?? "<undefined>"}
                {" @ "}
                {lists["vehicle_classes"]?.list?.find(
                  (t) => t.value === data.setup.VehicleClassId
                )?.name ?? "<undefined>"}
              </h5>
            ) : (
              <></>
            )}
          </div>
          <div>
            <Row>
              <label>
                <ImTrophy color="gold" />
                <span>{firstPlace?.name}</span>
              </label>{" "}
            </Row>
            <Row>
              <label>
                <ImTrophy color="silver" />
                <span>{secondPlace?.name}</span>
              </label>
            </Row>
            <Row>
              <label>
                <ImTrophy color="tan" />
                <span>{thirdPlace?.name}</span>
              </label>
            </Row>
          </div>
          <div>
            <span>End Time: </span>
            <br />
            <small>{endTime.toLocaleString()}</small>
          </div>
          <div>
            <div>
              {sessionLength + " "}
              {timedSession ? "Minutes" : "Laps"}
            </div>
            {data.finished ? (
              <Button variant="outline-success" disabled>
                Finished
              </Button>
            ) : (
              <Button variant="outline-warning" disabled>
                Not Finished
              </Button>
            )}
          </div>
        </div>
        <Accordion.Item eventKey={data.index}>
          <Accordion.Header>Details:</Accordion.Header>
          <Accordion.Body>
            {/* 
                         add some more details about the server/race here
                        */}
            {lists["vehicles"] ? (
              <SessionHistoryEntryScoreboard
                race={data.stages.race1}
                vehicles={lists["vehicles"].list}
              />
            ) : (
              <></>
            )}
          </Accordion.Body>
        </Accordion.Item>
      </div>
    </Accordion>
  );
};
export default SessionHistoryEntry;
