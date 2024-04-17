/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { Accordion, Button, Row, Col, Container,Badge, Modal } from "react-bootstrap";
import { ImTrophy } from "react-icons/im";
import SessionHistoryEntryScoreboard from "./SessionHistoryEntryScoreboard";
import getAPIData from "../../utils/getAPIData";

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
  const [showLeague, setShowLeague] = useState(0);
  const [fullLeagueInfo,setFullLeagueInfo] = useState(null);

  useEffect(() => {
    setStartTime(new Date(data.start_time * 1000));
    setEndTime(new Date(data.end_time * 1000));

    setLeagueId(data.league)

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
  function clickLeague(){
    setShowLeague(leagueId)
    getAPIData("/leagues/get/?id=" + leagueId)
    .then((res) => setFullLeagueInfo(res))
  }
  const handleClose = () => { setFullLeagueInfo(null); setShowLeague(0); }
  return (
    <Accordion>
        <Container className={ leagueId == null ? "history-entry" : "league-entry history-entry"}>
        {
          leagueId && <Badge bg="info" className="league-badge" onClick={clickLeague}>League Info</Badge>
        }
        {
          showLeague !== 0 && 
          <Modal show={showLeague !== 0} onHide={handleClose}>
            <Modal.Header closeButton>
              <Modal.Title>{fullLeagueInfo ? fullLeagueInfo?.Name : 'Loading...'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>League information WIP</Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleClose}>
                Close
              </Button>
              <Button variant="primary" onClick={handleClose}>
                Save Changes
              </Button>
            </Modal.Footer>
          </Modal>
        }
        <Row className="history-entry-data">
          <Col lg="4">
            {lists["tracks"] ? (
              <h5>
                {lists["vehicle_classes"]?.list?.find(
                  (t) => t.value === data.setup.VehicleClassId
                )?.name ?? "<undefined>"}
                {" @ "}
                {lists["tracks"]?.list?.find((t) => t.id === data.setup.TrackId)
                  ?.name ?? "<undefined>"}
              </h5>
            ) : (
              <></>
            )}
            <small>{endTime.toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric'}) + " " + endTime.toLocaleString("en",{timeStyle:'short'}) }</small>
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
          <Col xs lg="2">
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
                    winningTime={polePosition?.winningTime}
                    vehicles={lists["vehicles"].list}
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
                winningTime={firstPlace?.TotalTime}
                vehicles={lists["vehicles"].list}
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
