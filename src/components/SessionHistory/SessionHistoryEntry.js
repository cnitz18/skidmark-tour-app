/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { Accordion, Button, Row, Col, Container,Badge, OverlayTrigger, Tooltip } from "react-bootstrap";
import { ImTrophy } from "react-icons/im";
import SessionHistoryEntryScoreboard from "./SessionHistoryEntryScoreboard";
import getAPIData from "../../utils/getAPIData";
import { Link } from "react-router-dom";
import { IoInformationCircleOutline } from "react-icons/io5";
import NameMapper from "../../utils/Classes/NameMapper";

const SessionHistoryEntry = ({ data, enums, lists }) => {
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [raceOne, setRaceOne] = useState();
  const [polePosition, setPolePosition] = useState("");
  const [firstPlace, setFirstPlace] = useState("");
  const [secondPlace, setSecondPlace] = useState("");
  const [thirdPlace, setThirdPlace] = useState("");
  const [sessionFlags, setSessionFlags] = useState(0);
  const [sessionFlagToggles, setSessionFlagToggles] = useState({});
  const [sessionLength, setSessionLength] = useState(0);
  const [timedSession, setTimedSession] = useState(false);
  const [leagueId, setLeagueId] = useState(null);
  const [isHistorical, setIsHistorical] = useState(false);
  const [showLeague, setShowLeague] = useState(0);
  const [fullLeagueInfo,setFullLeagueInfo] = useState(null);

  useEffect(() => {
    setStartTime(new Date(data.start_time * 1000));
    setEndTime(new Date(data.end_time * 1000));

    setLeagueId(data.league)
    setIsHistorical(data.isHistoricalOrIncomplete ?? false)

    let race1 = data?.stages?.race1;
    let quali1 = data?.stages?.qualifying1;
    if (race1 && race1?.results?.length) {
      setFirstPlace({
        ...race1?.results?.find((m) => m?.RacePosition === 1),
      });
      setSecondPlace({
        ...race1?.results?.find((m) => m?.RacePosition === 2),
      });
      setThirdPlace({
        ...race1?.results?.find((m) => m?.RacePosition === 3),
      });
    }
    else{
      setFirstPlace("");
      setSecondPlace("");
      setThirdPlace();
    }
    if( quali1 ){
      setPolePosition({
        ...quali1?.results?.find((m) => m?.RacePosition === 1),
      });
    }else{
      setPolePosition("")
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
        <Container className={ leagueId == null ? "history-entry" : "league-entry history-entry"}>
        {
          leagueId &&
          <Link
            to={`/league/${leagueId}`}
            state={{ leagueId }}
            >
            <Badge bg="info" className="league-badge">League Info</Badge>
          </Link>
        }
        {
          isHistorical &&
          <OverlayTrigger 
            placement="top"
            overlay={(props) => (
                <Tooltip {...props}>
                    This information was manually entered based on historical screenshots. Not all information may be completely accurate.
                </Tooltip>
              )}
          >
            <div className="info-marker">
              <IoInformationCircleOutline color="red"/>
            </div>
          </OverlayTrigger>
        }
        <Row className="history-entry-data">
          <Col lg="4">
            {lists["tracks"] ? (
              <>
                <h5>
                  {NameMapper.fromVehicleClassId(data.setup.VehicleClassId,lists["vehicle_classes"]?.list)}
                </h5>
                <p>
                  {NameMapper.fromTrackId(data.setup.TrackId,lists["tracks"]?.list)}
                </p>
              </>
            ) : (
              <></>
            )}
          </Col>
          <Col className="text-center">
            <Row className="lessVerticalPadding">
              <label>
                <ImTrophy color="gold" className="trophy" size={40}/>
                <span className="firstPlace">{firstPlace?.name}</span>
              </label>{" "}
            </Row>
            <Row className="justify-content-md-center lessVerticalPadding">
              <Col md="auto">
                <label>
                  <ImTrophy color="silver" className="trophy" size={20} />
                  <small>{secondPlace?.name}</small>
                </label>
              </Col>
              <Col md="auto">
                <label>
                  <ImTrophy color="tan" className="trophy" size={20} />
                  <small>{thirdPlace?.name}</small>
                </label>
              </Col>
            </Row>
          </Col>
          <Col xs lg="2" className="text-center">
            <div>
              <b>
                {sessionLength + " "}
                {timedSession ? "Minutes" : "Laps"}
              </b>
            </div>
            {data.finished ? (
              <></>
            ) : (
              <Button variant="outline-warning" disabled>
                Not Finished
              </Button>
            )}
             <small>{startTime.toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric'}) }</small>
             <br/>
             <small>{startTime.toLocaleString("en",{timeStyle:'short'})}</small>
          </Col>
        </Row>
        {
          data.stages.practice1 && (
            <Accordion.Item eventKey={data.index + '_prac1'}>
              <Accordion.Header>Practice Details:</Accordion.Header>
              <Accordion.Body>
                {/* 
                            add some more details about the server/race here
                            */}
                {lists["vehicles"] ? (
                  <SessionHistoryEntryScoreboard
                    race={data.stages.practice1}
                    vehicles={lists["vehicles"].list}
                    session="practice"
                  />
                ) : (
                  <></>
                )}
              </Accordion.Body>
            </Accordion.Item>
          )
        }
        {
          data.stages.qualifying1 && (
            <Accordion.Item eventKey={data.index + '_qual1'}>
              <Accordion.Header>Qualifying Details:</Accordion.Header>
              <Accordion.Body>
                {/* 
                            add some more details about the server/race here
                            */}
                {lists["vehicles"] ? (
                  <SessionHistoryEntryScoreboard
                    race={data.stages.qualifying1}
                    vehicles={lists["vehicles"].list}
                    session="qualifying"
                  />
                ) : (
                  <></>
                )}
              </Accordion.Body>
            </Accordion.Item>
          )
        }
        <Accordion.Item eventKey={data.index + '_race1'}>
          <Accordion.Header>Race Details:</Accordion.Header>
          <Accordion.Body>
            {/* 
                         add some more details about the server/race here
                        */}
            {lists["vehicles"] ? (
              <SessionHistoryEntryScoreboard
                race={data.stages.race1}
                winner={firstPlace}
                vehicles={lists["vehicles"].list}
                session="race"
              />
            ) : (
              <></>
            )}
          </Accordion.Body>
        </Accordion.Item>
      </Container>
    </Accordion>
  );
};
export default SessionHistoryEntry;
