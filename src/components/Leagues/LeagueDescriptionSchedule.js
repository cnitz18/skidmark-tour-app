import { useState, useEffect } from "react";
import { Spinner, Row } from "react-bootstrap";
import SessionHistoryEntry from "../SessionHistory/SessionHistoryEntry";
import NameMapper from "../../utils/Classes/NameMapper";
import { Table, TableHead, TableBody, TableRow, TableCell, Chip } from "@mui/material";
import { format } from 'date-fns';
import { BsChevronDown, BsChevronUp, BsArrowUp, BsArrowDown } from "react-icons/bs";
import styles from './LeagueDescriptionSchedule.module.css';

const LeagueDescriptionSchedule = ({ showHistorySpinner, leagueHistory, enums, lists, league, targetRaceId, onClearTarget, onSwitchToSchedule }) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    if (!targetRaceId) return;
    const el = document.getElementById(`race-${targetRaceId}`);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add(styles.raceHighlight);
        setTimeout(() => el.classList.remove(styles.raceHighlight), 2000);
      }, 80);
    }
    onClearTarget?.();
  }, [targetRaceId, onClearTarget]);

  const sortedRaces = league?.races?.slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date)) || [];
  const nextRaceIndex = sortedRaces.findIndex(r => !r.completed);
  const completedCount = sortedRaces.filter(r => r.completed).length;

  const resolveRoundHistoryRaceId = (roundRace) => {
    if (!roundRace?.track || !roundRace?.date || !leagueHistory?.length) return null;
    const targetTs = new Date(roundRace.date).getTime() / 1000;
    const matching = leagueHistory
      .filter((h) => h?.setup?.TrackId === roundRace.track && h?.id && h?.start_time)
      .sort((a, b) => Math.abs(a.start_time - targetTs) - Math.abs(b.start_time - targetTs));
    return matching[0]?.id || null;
  };

  const handleRoundClick = (roundRace) => {
    const raceId = resolveRoundHistoryRaceId(roundRace);
    if (raceId && onSwitchToSchedule) {
      onSwitchToSchedule(raceId);
    }
  };

  return (
    <>
      {/* Round strip + collapsible calendar */}
      {sortedRaces.length > 0 && (
        <div className="mb-3">
          <div className={styles.stripHeader}>
            <span className={styles.stripLabel}>
              {completedCount}/{sortedRaces.length} Rounds Complete
            </span>
            <button
              className={styles.toggleBtn}
              onClick={() => setCalendarOpen(o => !o)}
            >
              {calendarOpen ? <BsChevronUp size={9} /> : <BsChevronDown size={9} />}
              {calendarOpen ? 'Hide calendar' : 'Show calendar'}
            </button>
          </div>

          <div className={styles.roundStrip}>
            {sortedRaces.map((r, i) => {
              const status = r.completed ? 'done' : (i === nextRaceIndex ? 'next' : 'future');
              const trackName = NameMapper.fromTrackApiName(NameMapper.fromTrackId(r.track, lists?.tracks?.list) || '') || `Rd ${i + 1}`;
              // Abbreviate to first word of track name for the dot label
              const shortTrack = trackName.split(' ')[0];
              const roundRaceId = resolveRoundHistoryRaceId(r);
              const isClickable = Boolean(roundRaceId && onSwitchToSchedule);
              return (
                <div
                  key={i}
                  className={`${styles.roundItem} ${status === 'done' ? styles.done : ''} ${isClickable ? styles.roundItemClickable : ''}`}
                  title={`Round ${i + 1}: ${trackName} \u2014 ${format(new Date(r.date), 'PPP')}`}
                  role={isClickable ? 'button' : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  onClick={isClickable ? () => handleRoundClick(r) : undefined}
                  onKeyDown={isClickable ? (e) => e.key === 'Enter' && handleRoundClick(r) : undefined}
                >
                  <div className={`${styles.roundDot} ${styles[status]}`}>{i + 1}</div>
                  <div className={`${styles.roundTrack} ${styles[status]}`}>{shortTrack}</div>
                </div>
              );
            })}
          </div>

          <div className={`${styles.calendarCollapse} ${calendarOpen ? styles.open : ''}`}>
            <div className="schedule-table-div mt-3">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>Rd</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Track</TableCell>
                    <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedRaces.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ textAlign: 'center' }}>{i + 1}</TableCell>
                      <TableCell>{format(new Date(r.date), 'PPp')}</TableCell>
                      <TableCell>{NameMapper.fromTrackApiName(NameMapper.fromTrackId(r.track, lists?.tracks?.list) || '') || '—'}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        {r.completed
                          ? <Chip size="small" label="Done" color="success" variant="outlined" />
                          : i === nextRaceIndex
                            ? <Chip size="small" label="Next" color="primary" variant="outlined" />
                            : <Chip size="small" label="Upcoming" color="default" variant="outlined" />
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* Race results */}
      <div className={styles.resultsHeader}>
        <span>Race Results</span>
        <button className={styles.sortToggle} onClick={() => setSortAsc(a => !a)}>
          {sortAsc ? <><BsArrowUp size={9} /> Oldest first</> : <><BsArrowDown size={9} /> Newest first</>}
        </button>
      </div>

      {!showHistorySpinner && leagueHistory?.length ? (
        <Row className="motion-stagger">
          {[...leagueHistory]
            .sort((a, b) => sortAsc ? a.end_time - b.end_time : b.end_time - a.end_time)
            .map((h, i) => (
              <div key={i} id={`race-${h.id}`} className="w-100 px-0" style={{ flex: '0 0 100%' }}>
                <SessionHistoryEntry data={h} enums={enums} lists={lists} />
              </div>
            ))
          }
        </Row>
      ) : null}

      {showHistorySpinner && (
        <div className="text-center mt-4">
          <Spinner animation="border" role="status" />
          <div className="mt-2 text-muted small">Loading Race Results...</div>
        </div>
      )}

      {!showHistorySpinner && !leagueHistory?.length && (
        <p className="text-muted text-center mt-4">
          No results yet &mdash; check back after the first race.
        </p>
      )}
    </>
  );
};

export default LeagueDescriptionSchedule;
