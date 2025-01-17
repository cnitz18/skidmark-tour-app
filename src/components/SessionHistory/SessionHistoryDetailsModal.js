import { Modal, Button, ListGroup, Row, Col } from 'react-bootstrap';
import { 
  BsCalendar3, 
  BsSpeedometer, 
  BsCarFrontFill,
  BsShield,
  BsCloud
} from 'react-icons/bs';
import { FaFlagCheckered } from "react-icons/fa";
import NameMapper from "../../utils/Classes/NameMapper";
import styles from './SessionHistoryDetailsModal.module.css';
import { useEffect, useState } from 'react';

const SessionHistoryDetailsModal = ({ show, handleClose, setup, lists, enums }) => {
  const [flags,setFlags] = useState([]);
  function getDamageType(type){
    switch(type) {
      case 0: return "None";
      case 1: return "Visual Only";
      case 2: return "Limited";
      case 3: return "Full";
      default: return "Unknown";
    }
  };

  function formatDate(year, month, day, hour) {
    return new Date(year, month-1, day, hour).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric'
    });
  };

  function translateFlags() {
    let curValue = setup.Flags;
    let flagStatuses = [];
    let flagInfo =  lists.flags.session?.list;
    flagInfo
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .forEach((f) => {
        let thisStatus = { checked: false, ...f };
        if (
          (curValue - f.value >= 0 && f.name !== "COOLDOWNLAP") ||
          (f.name === "COOLDOWNLAP" && curValue < 0)
        ) {
          curValue -= f.value;
          thisStatus.checked = true;
        }
        switch( thisStatus.name ){
          case "COOLDOWNLAP":
            thisStatus.name = "Cooldown Lap";
            break;
          case "TCS_ALLOWED":
            thisStatus.name = "TCS Allowed";
            break;
          case "ABS_ALLOWED":
            thisStatus.name = "ABS Allowed";
            break;
          case "SC_ALLOWED":
            thisStatus.name = "SC Allowed";
            break;
          default:
            thisStatus.name = thisStatus.name
            .toLowerCase()
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
            break
        }
        flagStatuses.push(thisStatus)
      });
    setFlags([ ...flagStatuses ]);
  }

  useEffect(() => {
    translateFlags();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[setup])

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton className={styles.modalHeader}>
        <Modal.Title>Session Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ListGroup variant="flush">
          <ListGroup.Item>
            <h6><FaFlagCheckered className="me-2" />Race Configuration</h6>
            <Row>
              <Col md={6}>
                <div className={styles.detailItem}>
                  <strong>Track:</strong> {NameMapper.fromTrackId(setup.TrackId, lists["tracks"]?.list)}
                </div>
                <div className={styles.detailItem}>
                  <strong>Vehicle Class:</strong> {NameMapper.fromVehicleClassId(setup.VehicleClassId, lists["vehicle_classes"]?.list)}
                </div>
                <div className={styles.detailItem}>
                  <strong>Race Length:</strong> {setup.RaceLength} { flags?.find(f => f.name === "Timed Race") ? "minutes" : "laps"}                </div>
                <div className={styles.detailItem}>
                  <strong>Extra Lap:</strong> {setup.RaceExtraLap ? "Yes" : "No"}
                </div>
              </Col>
              <Col md={6}>
                <div className={styles.detailItem}>
                  <strong>AI Difficulty:</strong> {setup.OpponentDifficulty}%
                </div>
                <div className={styles.detailItem}>
                  <strong>Grid Size:</strong> {setup.GridSize}
                </div>
                <div className={styles.detailItem}>
                  <strong>Max Players:</strong> {setup.MaxPlayers}
                </div>
              </Col>
            </Row>
          </ListGroup.Item>

          <ListGroup.Item>
            <h6><BsCalendar3 className="me-2" />In-Game Date & Time</h6>
            <div className={styles.detailItem}>
              {formatDate(setup.RaceDateYear, setup.RaceDateMonth, setup.RaceDateDay, setup.RaceDateHour)}
            </div>
          </ListGroup.Item>

          <ListGroup.Item>
            <h6><BsShield className="me-2" />Damage Settings</h6>
            <Row>
              <Col md={6}>
                <div className={styles.detailItem}>
                  <strong>Damage Type:</strong> {getDamageType(setup.DamageType)}
                </div>
              </Col>
              <Col md={6}>
                <div className={styles.detailItem}>
                  <strong>Damage Scale:</strong> {setup.DamageScale * 100}%
                </div>
              </Col>
            </Row>
          </ListGroup.Item>

          <ListGroup.Item>
            <h6><BsSpeedometer className="me-2" />Race Parameters</h6>
            <Row>
              <Col md={6}>
                {
                  flags?.length &&
                  flags.slice(0, Math.floor(flags.length / 2)).map((flag, i) => (
                    <div key={i} className={styles.detailItem}>
                      <strong>{flag.name}:</strong> {flag.checked ? "True" : "False"}
                    </div>
                  ))
                }
              </Col>
              <Col md={6}>
                {
                  flags?.length &&
                  flags.slice(Math.ceil(flags.length / 2)).map((flag, i) => (
                    <div key={i} className={styles.detailItem}>
                      <strong>{flag.name}:</strong> {flag.checked ? "True" : "False"}
                    </div>
                  ))
                }
              </Col>
            </Row>
          </ListGroup.Item>

          <ListGroup.Item>
            <h6><BsCloud className="me-2" />Weather Configuration</h6>
              <Row>
                <Col md={6}>
                  <div className={styles.detailItem}>
                    <strong>Active Slots:</strong> {setup.RaceWeatherSlots}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Slot 2:</strong> {NameMapper.fromWeatherSlot(setup.RaceWeatherSlot2,enums)}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Slot 4:</strong> {NameMapper.fromWeatherSlot(setup.RaceWeatherSlot4,enums)}
                  </div>
                </Col>
                <Col md={6}>
                  <div className={styles.detailItem}>
                    <strong>Slot 1:</strong> {NameMapper.fromWeatherSlot(setup.RaceWeatherSlot1,enums)}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Slot 3:</strong> {NameMapper.fromWeatherSlot(setup.RaceWeatherSlot3,enums)}
                  </div>
                </Col>
            </Row>
          </ListGroup.Item>

          <ListGroup.Item>
            <h6><BsCarFrontFill className="me-2" />Multiclass Configuration</h6>
              <Row>
                <Col md={6}>
                  <div className={styles.detailItem}>
                    <strong>Active Slots:</strong> {setup.MultiClassSlots}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Slot 2:</strong> {NameMapper.fromVehicleClassId(setup.MultiClassSlot2,lists['vehicle_classes']?.list,'N/A')}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Slot 4:</strong> {NameMapper.fromVehicleClassId(setup.MultiClassSlot4,lists['vehicle_classes']?.list,'N/A')}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Slot 6:</strong> {NameMapper.fromVehicleClassId(setup.MultiClassSlot6,lists['vehicle_classes']?.list,'N/A')}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Slot 8:</strong> {NameMapper.fromVehicleClassId(setup.MultiClassSlot8,lists['vehicle_classes']?.list,'N/A')}
                  </div>
                </Col>
                <Col md={6}>
                  <div className={styles.detailItem}>
                    <strong>Slot 1:</strong> {NameMapper.fromVehicleClassId(setup.MultiClassSlot1,lists['vehicle_classes']?.list,'N/A')}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Slot 3:</strong> {NameMapper.fromVehicleClassId(setup.MultiClassSlot3,lists['vehicle_classes']?.list,'N/A')}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Slot 5:</strong> {NameMapper.fromVehicleClassId(setup.MultiClassSlot5,lists['vehicle_classes']?.list,'N/A')}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Slot 7:</strong> {NameMapper.fromVehicleClassId(setup.MultiClassSlot7,lists['vehicle_classes']?.list,'N/A')}
                  </div>
                  <div className={styles.detailItem}>
                    <strong>Slot 9:</strong> {NameMapper.fromVehicleClassId(setup.MultiClassSlot9,lists['vehicle_classes']?.list,'N/A')}
                  </div>
                </Col>
            </Row>
          </ListGroup.Item>
        </ListGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SessionHistoryDetailsModal;