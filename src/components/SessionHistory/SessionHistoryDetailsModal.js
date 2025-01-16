import { Modal, Button, ListGroup, Row, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { 
  BsCalendar3, 
  BsClock, 
  BsSpeedometer, 
  BsCarFrontFill,
  BsCloud, 
  BsShield 
} from 'react-icons/bs';
import NameMapper from "../../utils/Classes/NameMapper";
import styles from './SessionHistoryDetailsModal.module.css';
import { useEffect } from 'react';

const SessionHistoryDetailsModal = ({ show, handleClose, setup, lists }) => {
  const getDamageType = (type) => {
    switch(type) {
      case 0: return "None";
      case 1: return "Visual Only";
      case 2: return "Limited";
      case 3: return "Full";
      default: return "Unknown";
    }
  };

  const formatDate = (year, month, day, hour) => {
    return new Date(year, month-1, day, hour).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit'
    });
  };

  useEffect(() => {
    console.log('setup:',setup)
  },[setup])

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton className={styles.modalHeader}>
        <Modal.Title>Session Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ListGroup variant="flush">
          <ListGroup.Item>
            <h6><BsCarFrontFill className="me-2" />Race Configuration</h6>
            <Row>
              <Col md={6}>
                <div className={styles.detailItem}>
                  <strong>Track:</strong> {NameMapper.fromTrackId(setup.TrackId, lists["tracks"]?.list)}
                </div>
                <div className={styles.detailItem}>
                  <strong>Vehicle Class:</strong> {NameMapper.fromVehicleClassId(setup.VehicleClassId, lists["vehicle_classes"]?.list)}
                </div>
              </Col>
              <Col md={6}>
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
            <h6><BsCalendar3 className="me-2" />Date & Time</h6>
            <div className={styles.detailItem}>
              {formatDate(setup.RaceDateYear, setup.RaceDateMonth, setup.RaceDateDay, setup.RaceDateHour)}
            </div>
          </ListGroup.Item>

          <ListGroup.Item>
            <h6><BsSpeedometer className="me-2" />Race Parameters</h6>
            <Row>
              <Col md={6}>
                <div className={styles.detailItem}>
                  <strong>Race Length:</strong> {setup.RaceLength} laps
                </div>
                <div className={styles.detailItem}>
                  <strong>Extra Lap:</strong> {setup.RaceExtraLap ? "Yes" : "No"}
                </div>
              </Col>
              <Col md={6}>
                <div className={styles.detailItem}>
                  <strong>AI Difficulty:</strong> {setup.OpponentDifficulty}%
                </div>
              </Col>
            </Row>
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
        </ListGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SessionHistoryDetailsModal;