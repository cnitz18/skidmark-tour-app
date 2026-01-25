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
import SessionHistoryDetailsModal from "./SessionHistoryDetailsModal";

const SessionHistoryEntry = ({ data, enums, lists, showLeagueInfo }) => {
  const [startTime, setStartTime] = useState(new Date());
  const [practiceOne, setPracticeOne] = useState();
  const [qualiOne, setQualiOne] = useState();
  const [raceOne, setRaceOne] = useState();
  const [polePosition, setPolePosition] = useState("");
  const [firstPlace, setFirstPlace] = useState("");
  const [secondPlace, setSecondPlace] = useState("");
  const [thirdPlace, setThirdPlace] = useState("");
  const [sessionLength, setSessionLength] = useState(0);
  const [timedSession, setTimedSession] = useState(false);
  const [leagueId, setLeagueId] = useState(null);
  const [isHistorical, setIsHistorical] = useState(false);
  const [isFeature, setIsFeature] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if( raceOne && !raceOne.results?.length ){
      getAPIData(`/api/batchupload/sms_stats_data/results/?stage_id=${raceOne.id}`)
      .then((res) => setRaceOne({...raceOne, results: res}))
      .catch((err) => console.log(err));
    }
    if (raceOne && raceOne?.results?.length) {
      setFirstPlace({
        ...raceOne?.results?.find((m) => m?.RacePosition === 1),
      });
      setSecondPlace({
        ...raceOne?.results?.find((m) => m?.RacePosition === 2),
      });
      setThirdPlace({
        ...raceOne?.results?.find((m) => m?.RacePosition === 3),
      });
    }
    else{
      setFirstPlace("");
      setSecondPlace("");
      setThirdPlace();
    }
  },[raceOne]);

  useEffect(() => {
    if( qualiOne && !qualiOne?.results?.length ){
      getAPIData(`/api/batchupload/sms_stats_data/results/?stage_id=${qualiOne.id}`)
      .then((res) => setQualiOne({...qualiOne, results: res}))
      .catch((err) => console.log(err));
    }
    else if( qualiOne && qualiOne.results?.length ){
      setPolePosition({
        ...qualiOne?.results?.find((m) => m?.RacePosition === 1),
      });
    }else{
      setPolePosition("")
    }
  },[qualiOne]);

  useEffect(() => {
    if( practiceOne && !practiceOne?.results?.length ){
      getAPIData(`/api/batchupload/sms_stats_data/results/?stage_id=${practiceOne.id}`)
      .then((res) => setPracticeOne({...practiceOne, results: res}))
      .catch((err) => console.log(err));
    } 
  },[practiceOne]);

  useEffect(() => {
    setStartTime(new Date(data.start_time * 1000));

    setLeagueId(data.league)
    setIsHistorical(data.isHistoricalOrIncomplete ?? false)
    setIsFeature(data.race_type && data.race_type.toLowerCase() === 'feature')

    setRaceOne(data?.stages?.race1);
    setQualiOne(data?.stages?.qualifying1);
    setPracticeOne(data?.stages?.practice1);

    let raceSetup = data?.setup;
    if (raceSetup) {
      let curValue = raceSetup.Flags;
      let flagStatus = {};
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
              curValue -= f.value;
              flagStatus[f.name].checked = true;
            }
          });
      }
      setTimedSession(flagStatus?.TIMED_RACE?.checked);
      setSessionLength(raceSetup.RaceLength);
    }
  }, [data]);
  return (
    <Accordion className="race-details-accordion">
        <Container className={`history-entry ${leagueId ? "league-entry" : ""} ${isFeature ? "feature-entry" : ""}`}>
        <Row className="history-entry-data">
          <Col lg="4" className="history-entry-data-title">
            {lists["tracks"] ? (
              <>
                <h5>
                  {NameMapper.fromVehicleClassId(data.setup.VehicleClassId,lists["vehicle_classes"]?.list)}
                  {isFeature && <Badge bg="warning" text="dark" className="ms-2" style={{fontSize: '0.6em', verticalAlign: 'middle'}}>Feature</Badge>}
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
          <Col lg="2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', top: '10px', right: '10px' }}>
              {isHistorical ? (
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
              ) : (
                <Link
                  onClick={() => setShowModal(true)}
                >
                  <Badge bg="secondary" className="session-details-badge">Session Details</Badge>
                </Link>
              )}
              {leagueId && (
                <Link to={`/league/${leagueId}`} state={{ leagueId }}>
                  {showLeagueInfo && <Badge bg="info" className="league-badge">League Info</Badge>}
                </Link>
              )}
            </div>
          </Col>
        </Row>
        
        <SessionHistoryDetailsModal 
          show={showModal}
          handleClose={() => setShowModal(false)}
          setup={data.setup}
          lists={lists}
          enums={enums}
        />
        
        {
          practiceOne && (
            <Accordion.Item eventKey={data.index + '_prac1'}>
              <Accordion.Header>Practice Details:</Accordion.Header>
              <Accordion.Body>
                {/* 
                            add some more details about the server/race here
                            */}
                {lists["vehicles"] ? (
                  <SessionHistoryEntryScoreboard
                    race={practiceOne}
                    vehicles={lists["vehicles"].list}
                    session="Practice"
                  />
                ) : (
                  <></>
                )}
              </Accordion.Body>
            </Accordion.Item>
          )
        }
        {
          qualiOne && (
            <Accordion.Item eventKey={data.index + '_qual1'}>
              <Accordion.Header>Qualifying Details:</Accordion.Header>
              <Accordion.Body>
                {/* 
                            add some more details about the server/race here
                            */}
                {lists["vehicles"] ? (
                  <SessionHistoryEntryScoreboard
                    race={qualiOne}
                    vehicles={lists["vehicles"].list}
                    winner={polePosition}
                    session="Qualifying"
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
                race={raceOne}
                winner={firstPlace}
                vehicles={lists["vehicles"].list}
                session="Race"
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
