import { Modal, Button } from 'react-bootstrap';
import { 
  BsSpeedometer, 
  BsCarFrontFill,
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

  function getDamageScale(type){
    switch(type) {
      case 0: return "Low";
      case 1: return "Medium";
      case 2: return "High";
      case 3: return "Max";
      default: return "Unknown";
    }
  }

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
    if( Object.keys(lists).length && Object.keys(setup).length ){
      translateFlags();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[setup,lists])

  const trackName = lists?.tracks?.list
    ? (NameMapper.fromTrackApiName(NameMapper.fromTrackId(setup?.TrackId, lists?.tracks?.list)) || 'Unknown Track')
    : '';

  const activeFlags = flags.filter(f => f.checked);
  const inactiveFlags = flags.filter(f => !f.checked);
  const isTimedRace = flags.find(f => f.name === 'Timed Race')?.checked;

  const activeWeatherSlots = Array.from({ length: setup.RaceWeatherSlots || 0 }, (_, i) => ({
    index: i + 1,
    name: NameMapper.fromWeatherSlot(setup[`RaceWeatherSlot${i + 1}`], enums),
  }));

  const activeMulticlassSlots = Array.from({ length: setup.MultiClassSlots || 0 }, (_, i) => ({
    index: i + 1,
    name: NameMapper.fromVehicleClassId(setup[`MultiClassSlot${i + 1}`], lists['vehicle_classes']?.list, 'N/A'),
  })).filter(s => s.name !== 'N/A');

  return (
    <Modal show={show} onHide={handleClose} size="lg" scrollable contentClassName={styles.modalContent}>
      <Modal.Header closeButton className={styles.modalHeader}>
        <Modal.Title className={styles.modalTitle}>
          Session Details{trackName ? ` — ${trackName}` : ''}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className={styles.modalBody}>

        {/* Section 1: Race Configuration (absorbs Date + Damage) */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <FaFlagCheckered className={styles.sectionIcon} />
            <span>Race Configuration</span>
          </div>
          <div className={styles.detailGrid}>
            <div className={styles.detailCell}>
              <span className={styles.detailLabel}>Track</span>
              <span className={styles.detailValue}>{trackName}</span>
            </div>
            <div className={styles.detailCell}>
              <span className={styles.detailLabel}>Vehicle Class</span>
              <span className={styles.detailValue}>{NameMapper.fromVehicleClassId(setup.VehicleClassId, lists['vehicle_classes']?.list)}</span>
            </div>
            <div className={styles.detailCell}>
              <span className={styles.detailLabel}>Race Length</span>
              <span className={styles.detailValue}>{setup.RaceLength} {isTimedRace ? 'minutes' : 'laps'}</span>
            </div>
            <div className={styles.detailCell}>
              <span className={styles.detailLabel}>Extra Lap</span>
              <span className={styles.detailValue}>{setup.RaceExtraLap ? 'Yes' : 'No'}</span>
            </div>
            <div className={styles.detailCell}>
              <span className={styles.detailLabel}>In-Game Date</span>
              <span className={styles.detailValue}>{formatDate(setup.RaceDateYear, setup.RaceDateMonth, setup.RaceDateDay, setup.RaceDateHour)}</span>
            </div>
            <div className={styles.detailCell}>
              <span className={styles.detailLabel}>AI Difficulty</span>
              <span className={styles.detailValue}>{setup.OpponentDifficulty}%</span>
            </div>
            <div className={styles.detailCell}>
              <span className={styles.detailLabel}>Grid Size</span>
              <span className={styles.detailValue}>{setup.GridSize}</span>
            </div>
            <div className={styles.detailCell}>
              <span className={styles.detailLabel}>Max Players</span>
              <span className={styles.detailValue}>{setup.MaxPlayers}</span>
            </div>
            <div className={styles.detailCell}>
              <span className={styles.detailLabel}>Damage Type</span>
              <span className={styles.detailValue}>{getDamageType(setup.DamageType)}</span>
            </div>
            <div className={styles.detailCell}>
              <span className={styles.detailLabel}>Damage Scale</span>
              <span className={styles.detailValue}>{getDamageScale(setup.DamageScale)}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Race Parameters (flags) */}
        {flags.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <BsSpeedometer className={styles.sectionIcon} />
              <span>Race Parameters</span>
            </div>
            <div className={styles.flagsBody}>
              {activeFlags.length > 0 && (
                <div className={styles.flagsRow}>
                  {activeFlags.map((flag, i) => (
                    <span key={i} className={styles.flagActive}>{flag.name}</span>
                  ))}
                </div>
              )}
              {inactiveFlags.length > 0 && (
                <div className={`${styles.flagsRow} ${activeFlags.length > 0 ? styles.flagsInactiveRow : ''}`}>
                  {inactiveFlags.map((flag, i) => (
                    <span key={i} className={styles.flagInactive}>{flag.name}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 3: Weather */}
        {activeWeatherSlots.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <BsCloud className={styles.sectionIcon} />
              <span>Weather Configuration</span>
            </div>
            <div className={styles.detailGrid}>
              {activeWeatherSlots.map(slot => (
                <div key={slot.index} className={styles.detailCell}>
                  <span className={styles.detailLabel}>Slot {slot.index}</span>
                  <span className={styles.detailValue}>{slot.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Multiclass */}
        {activeMulticlassSlots.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <BsCarFrontFill className={styles.sectionIcon} />
              <span>Multiclass Configuration</span>
            </div>
            <div className={styles.detailGrid}>
              {activeMulticlassSlots.map(slot => (
                <div key={slot.index} className={styles.detailCell}>
                  <span className={styles.detailLabel}>Slot {slot.index}</span>
                  <span className={styles.detailValue}>{slot.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </Modal.Body>
      <Modal.Footer className={styles.modalFooter}>
        <Button variant="secondary" onClick={handleClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SessionHistoryDetailsModal;