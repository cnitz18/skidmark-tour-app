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
  const [isPracticeLoading, setIsPracticeLoading] = useState(false);
  const [isQualiLoading, setIsQualiLoading] = useState(false);

  useEffect(() => {
    if (raceOne && !raceOne.results?.length) {
      getAPIData(`/api/batchupload/sms_stats_data/results/?stage_id=${raceOne.id}`)
        .then((res) => setRaceOne({ ...raceOne, results: res }))
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
    } else {
      setFirstPlace("");
      setSecondPlace("");
      setThirdPlace();
    }
  }, [raceOne]);

  useEffect(() => {
    if (qualiOne && qualiOne.results?.length) {
      setPolePosition({
        ...qualiOne?.results?.find((m) => m?.RacePosition === 1),
      });
    } else {
      setPolePosition("");
    }
  }, [qualiOne]);

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

  async function loadPracticeResults() {
    if (!practiceOne || practiceOne?.results?.length || isPracticeLoading) {
      return;
    }

    try {
      setIsPracticeLoading(true);
      const res = await getAPIData(`/api/batchupload/sms_stats_data/results/?stage_id=${practiceOne.id}`);
      setPracticeOne({ ...practiceOne, results: res });
    } catch (err) {
      console.log(err);
    } finally {
      setIsPracticeLoading(false);
    }
  }

  async function loadQualiResults() {
    if (!qualiOne || qualiOne?.results?.length || isQualiLoading) {
      return;
    }

    try {
      setIsQualiLoading(true);
      const res = await getAPIData(`/api/batchupload/sms_stats_data/results/?stage_id=${qualiOne.id}`);
      setQualiOne({ ...qualiOne, results: res });
    } catch (err) {
      console.log(err);
    } finally {
      setIsQualiLoading(false);
    }
  }

  const trackDisplayName =
    lists?.tracks?.list
      ? (NameMapper.fromTrackApiName(NameMapper.fromTrackId(data?.setup?.TrackId, lists?.tracks?.list)) || "Unknown Track")
      : "Loading track...";

  const vehicleClassDisplayName =
    lists?.vehicle_classes?.list
      ? (
          NameMapper.fromVehicleClassApiName(
            NameMapper.fromVehicleClassId(data?.setup?.VehicleClassId, lists?.vehicle_classes?.list, "")
          ) || "Unknown Vehicle Class"
        )
      : "Loading class...";

  const firstPlaceName = firstPlace?.name || "";
  const secondPlaceName = secondPlace?.name || "";
  const thirdPlaceName = thirdPlace?.name || "";

  return (
    <Accordion className="race-details-accordion">
        <Container className={`history-entry ${leagueId ? "league-entry" : ""} ${isFeature ? "feature-entry" : ""}`}>
        {/* ── Mobile card layout (< md) ── */}
        <div className="d-md-none mobile-history-entry">
          <div className="mobile-entry-header">
            <div className="mobile-entry-title">
              <h5 className="mobile-track-name">
                {trackDisplayName}
                {isFeature && <Badge className="ms-2 feature-badge" style={{fontSize: '0.6em', verticalAlign: 'middle'}}>Feature</Badge>}
              </h5>
              <span className="mobile-car-class">{vehicleClassDisplayName}</span>
            </div>
          </div>

          <div className="mobile-podium">
            <div className="mobile-podium-winner">
              <ImTrophy color="gold" size={22} className="trophy" />
              <span className={`mobile-winner-name ${firstPlaceName ? "is-loaded" : "is-placeholder"}`}>
                {firstPlaceName || "\u00A0"}
              </span>
            </div>
            <div className="mobile-podium-rest">
              <span className={`mobile-place-name ${secondPlaceName ? "is-loaded" : "is-placeholder"}`}>
                <ImTrophy color="silver" size={14} className="trophy" />
                {secondPlaceName || "\u00A0"}
              </span>
              <span className={`mobile-place-name ${thirdPlaceName ? "is-loaded" : "is-placeholder"}`}>
                <ImTrophy color="tan" size={14} className="trophy" />
                {thirdPlaceName || "\u00A0"}
              </span>
            </div>
          </div>

          <div className="mobile-entry-footer">
            <span className="mobile-session-length">
              {sessionLength}&thinsp;{timedSession ? "min" : "laps"}
            </span>
            <span className="mobile-entry-dot">·</span>
            <span className="mobile-entry-date">
              {startTime.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
            <span className="mobile-entry-dot">·</span>
            {!data.finished && <Badge bg="warning" text="dark" className="me-1" style={{fontSize:'0.65em'}}>Incomplete</Badge>}
            <span className="mobile-entry-actions">
              {isHistorical ? (
                <OverlayTrigger
                  placement="top"
                  overlay={(props) => (
                    <Tooltip {...props}>
                      Manually entered from historical screenshots. May not be fully accurate.
                    </Tooltip>
                  )}
                >
                  <span><IoInformationCircleOutline color="red" /></span>
                </OverlayTrigger>
              ) : (
                <Link onClick={() => setShowModal(true)}>
                  <Badge bg="secondary" className="session-details-badge" style={{fontSize:'0.65em'}}>Details</Badge>
                </Link>
              )}
              {leagueId && showLeagueInfo && (
                <Link to={`/league/${leagueId}`} state={{ leagueId }}>
                  <Badge bg="info" className="league-badge" style={{fontSize:'0.65em'}}>League</Badge>
                </Link>
              )}
            </span>
          </div>
        </div>

        {/* ── Desktop layout (≥ md) ── */}
        <Row className="history-entry-data d-none d-md-flex">
          <Col lg="4" className="history-entry-data-title">
            <>
              <h5>
                {trackDisplayName}
                {isFeature && <Badge className="ms-3 feature-badge" style={{fontSize: '0.6em', verticalAlign: 'middle'}}>Feature</Badge>}
              </h5>
              <p>
                {vehicleClassDisplayName}
              </p>
            </>
          </Col>
          <Col className="text-center">
            <Row className="lessVerticalPadding">
              <label className="podium-label podium-label-main">
                <ImTrophy color="gold" className="trophy" size={40}/>
                <span className={`podium-name firstPlace ${firstPlaceName ? "is-loaded" : "is-placeholder"}`}>
                  {firstPlaceName || "\u00A0"}
                </span>
              </label>{" "}
            </Row>
            <Row className="justify-content-md-center lessVerticalPadding">
              <Col md="auto">
                <label className="podium-label">
                  <ImTrophy color="silver" className="trophy" size={20} />
                  <small className={`podium-name podium-name-sm ${secondPlaceName ? "is-loaded" : "is-placeholder"}`}>
                    {secondPlaceName || "\u00A0"}
                  </small>
                </label>
              </Col>
              <Col md="auto">
                <label className="podium-label">
                  <ImTrophy color="tan" className="trophy" size={20} />
                  <small className={`podium-name podium-name-sm ${thirdPlaceName ? "is-loaded" : "is-placeholder"}`}>
                    {thirdPlaceName || "\u00A0"}
                  </small>
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
            <div className="d-flex flex-row flex-md-column gap-2 align-items-center align-items-md-end justify-content-between justify-content-lg-end w-100">
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
              <Accordion.Header onClick={loadPracticeResults}>Practice Details:</Accordion.Header>
              <Accordion.Body>
                {/* 
                            add some more details about the server/race here
                            */}
                {isPracticeLoading && <div className="text-center py-2">Loading practice results...</div>}
                {lists["vehicles"] ? (
                  <SessionHistoryEntryScoreboard
                    race={practiceOne}
                    vehicles={lists["vehicles"].list}
                    session="Practice"
                    isHistorical={isHistorical}
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
              <Accordion.Header onClick={loadQualiResults}>Qualifying Details:</Accordion.Header>
              <Accordion.Body>
                {/* 
                            add some more details about the server/race here
                            */}
                {isQualiLoading && <div className="text-center py-2">Loading qualifying results...</div>}
                {lists["vehicles"] ? (
                  <SessionHistoryEntryScoreboard
                    race={qualiOne}
                    vehicles={lists["vehicles"].list}
                    winner={polePosition}
                    session="Qualifying"
                    isHistorical={isHistorical}
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
                isHistorical={isHistorical}
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
