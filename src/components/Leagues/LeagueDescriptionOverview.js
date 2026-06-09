import { Row, Col, ProgressBar, Spinner } from 'react-bootstrap';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import NameMapper from '../../utils/Classes/NameMapper';
import { BsTrophy } from 'react-icons/bs';
import { LuCrown } from "react-icons/lu";
import getAPIData from "../../utils/getAPIData";
import styles from './LeagueDescriptionOverview.module.css';

const LeagueDescriptionOverview = ({ league, standings, lists, leagueHistory, onSwitchToSchedule }) => {
  const [recentRaces, setRecentRaces] = useState([]);
  const [recentRaceResults, setRecentRaceResults] = useState({});
  const [showRecentRacesSpinner, setShowRecentRacesSpinner] = useState(true);
  const [closestFinish, setClosestFinish] = useState(null);
  const [closestFinishLoading, setClosestFinishLoading] = useState(true);

  const nextRace = league?.races?.slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .find(r => !r.completed);
  const champion = standings?.[0];
  const daysUntil = nextRace
    ? Math.ceil((new Date(nextRace.date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  // Computed season stats (from props, no API calls needed)
  const uniqueWinners = standings?.filter(d => d.Wins > 0).length ?? 0;
  const winningMargin = standings?.length >= 2 ? standings[0].Points - standings[1].Points : null;
  const driversWhoScored = standings?.filter(d => d.Points > 0).length ?? 0;

  // Fetch most recent race results (used in active view)
  useEffect(() => {
    const recent = [...(leagueHistory || [])]
      .sort((a, b) => b.start_time - a.start_time)
      .slice(0, 3);
    setRecentRaces(recent);
    setShowRecentRacesSpinner(false);
  }, [leagueHistory]);

  useEffect(() => {
    const racesWithStage = recentRaces?.filter(r => r.stages?.race1?.id && r.finished !== false);
    if (!racesWithStage?.length) return;
    Promise.all(
      racesWithStage.map(race =>
        getAPIData(`/api/batchupload/sms_stats_data/results/?stage_id=${race.stages.race1.id}`)
          .then(res => ({ raceId: race.id, results: res }))
          .catch(() => ({ raceId: race.id, results: null }))
      )
    ).then(arr => {
      const obj = {};
      arr.forEach(item => { obj[item.raceId] = item.results; });
      setRecentRaceResults(obj);
    });
  }, [recentRaces]);

  // Closest finish: loads independently, only for completed seasons
  useEffect(() => {
    if (!league?.completed || !leagueHistory?.length) {
      setClosestFinishLoading(false);
      return;
    }
    const racesWithId = leagueHistory.filter(h => h.stages?.race1?.id && h.finished !== false);
    if (!racesWithId.length) { setClosestFinishLoading(false); return; }

    Promise.all(
      racesWithId.map(h =>
        getAPIData(`/api/batchupload/sms_stats_data/results/?stage_id=${h.stages.race1.id}`)
          .then(results => {
            const p1 = results?.find(r => r.RacePosition === 1);
            const p2 = results?.find(r => r.RacePosition === 2);
            if (!p1?.TotalTime || !p2?.TotalTime) return null;
            const gap = p2.TotalTime - p1.TotalTime;
            // Exclude lapped cars (gap > 2 min) and invalid data
            if (gap <= 0 || gap > 120000) return null;
            return {
              gapMs: gap,
              trackName: NameMapper.fromTrackApiName(NameMapper.fromTrackId(h.setup?.TrackId, lists?.tracks?.list)) || 'Unknown Track',
              raceId: h.id
            };
          })
          .catch(() => null)
      )
    ).then(results => {
      const valid = results.filter(Boolean);
      if (valid.length) {
        setClosestFinish(valid.reduce((min, cur) => cur.gapMs < min.gapMs ? cur : min));
      }
      setClosestFinishLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [league?.completed, leagueHistory]);

  const renderStandingsRow = (driver, i, arr) => {
    const posDisplay = (i > 0 && driver.Position === arr[i - 1]?.Position)
      ? ''
      : NameMapper.positionFromNumber(driver.Position);
    const gap = i > 0 ? `\u2013${standings[0].Points - driver.Points}` : null;
    return (
      <div key={i} className={styles.standingsRow}>
        <span className={styles.standingsPos}>{posDisplay}</span>
        <span className={styles.standingsName}>{driver.PlayerName}</span>
        {gap && <span className={styles.standingsGap}>{gap}</span>}
        <span className={styles.standingsPoints}>{driver.Points} pts</span>
      </div>
    );
  };

  return (
    <div className="league-dashboard">
      {league.completed ? (
        // ===== COMPLETED SEASON =====
        <>
          {champion && (
            <div className={`mb-4 ${styles.championCard}`}>
              <div className={styles.championCardBody}>
                <div className={styles.championHeroInner}>
                  <div className={styles.championLeft}>
                    <div className={styles.crownIcon}>
                      <LuCrown size={44} />
                    </div>
                    <div>
                      <div className={styles.championLabel}>Season Champion</div>
                      <h2 className={styles.championNameBig}>{champion.PlayerName}</h2>
                      <div className={styles.championPoints}>{champion.Points} points</div>
                    </div>
                  </div>
                  <div className={styles.championStatsRow}>
                    {[
                      { value: champion.Wins || 0, label: 'Wins' },
                      { value: champion.Podiums || 0, label: 'Podiums' },
                      { value: champion.Poles || 0, label: 'Poles' },
                      { value: champion.FastestLaps || 0, label: 'Fastest Laps' },
                    ].map(stat => (
                      <div key={stat.label} className={styles.statItem}>
                        <div className={styles.statValue}>{stat.value}</div>
                        <div className={styles.statLabel}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Season in Numbers */}
          <div className={`${styles.seasonStats} mb-4`}>
            <div className={styles.seasonStat}>
              <div className={styles.seasonStatValue}>{uniqueWinners}</div>
              <div className={styles.seasonStatLabel}>
                different race {uniqueWinners === 1 ? 'winner' : 'winners'}
              </div>
            </div>
            <div className={styles.seasonStat}>
              <div className={styles.seasonStatValue}>{driversWhoScored}</div>
              <div className={styles.seasonStatLabel}>
                {driversWhoScored === 1 ? 'driver' : 'drivers'} scored points
              </div>
            </div>
            {winningMargin !== null && (
              <div className={styles.seasonStat}>
                <div className={styles.seasonStatValue}>{winningMargin}</div>
                <div className={styles.seasonStatLabel}>
                  Champion's winning margin
                </div>
              </div>
            )}
            <div
              className={`${styles.seasonStat} ${onSwitchToSchedule && closestFinish ? styles.seasonStatLink : ''}`}
              onClick={onSwitchToSchedule && closestFinish ? () => onSwitchToSchedule(closestFinish.raceId) : undefined}
              role={onSwitchToSchedule && closestFinish ? 'button' : undefined}
              tabIndex={onSwitchToSchedule && closestFinish ? 0 : undefined}
              onKeyDown={onSwitchToSchedule && closestFinish ? (e) => e.key === 'Enter' && onSwitchToSchedule(closestFinish.raceId) : undefined}
            >
              {closestFinishLoading ? (
                <Spinner size="sm" animation="border" variant="secondary" />
              ) : closestFinish ? (
                <>
                  <div className={styles.seasonStatLabel}>Closest Finish</div>
                  <div className={styles.seasonStatValue}>
                    {(closestFinish.gapMs / 1000).toFixed(3)}s
                  </div>
                  <div className={styles.seasonStatSub}>{closestFinish.trackName}</div>
                </>
              ) : (
                <div className={styles.seasonStatLabel} style={{ opacity: 0.4 }}>&mdash;</div>
              )}
            </div>
          </div>

          {/* Final Standings + Stat Leaders */}
          <Row className="g-3">
            <Col md={7}>
              <div className={styles.standingsSection}>
                <div className={styles.standingsHeader}>Final Standings</div>
                {standings?.map((driver, i, arr) => renderStandingsRow(driver, i, arr))}
              </div>
            </Col>
            <Col md={5}>
              <div className={styles.standingsSection}>
                <div className={styles.standingsHeader}>Stat Leaders</div>
                {[
                  { label: 'Wins', key: 'Wins', icon: '🏆' },
                  { label: 'Podiums', key: 'Podiums', icon: '🥂' },
                  { label: 'Poles', key: 'Poles', icon: '⚡' },
                  { label: 'Fastest Laps', key: 'FastestLaps', icon: '⏱' },
                ].map(({ label, key, icon }) => {
                  const top3 = [...(standings || [])]
                    .filter(d => (d[key] || 0) > 0)
                    .sort((a, b) => (b[key] || 0) - (a[key] || 0))
                    .slice(0, 3);
                  if (!top3.length) return null;
                  return (
                    <div key={key}>
                      <div className={styles.statLeaderCategory}>{icon} {label}</div>
                      {top3.map((d, i) => (
                        <div key={d.PlayerName} className={styles.standingsRow}>
                          <span className={styles.standingsPos}>{i + 1}</span>
                          <span className={styles.standingsName}>{d.PlayerName}</span>
                          <span className={styles.standingsPoints}>{d[key]}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </Col>
          </Row>
        </>
      ) : (
        // ===== ACTIVE SEASON =====
        <>
          {/* Next Race Hero */}
          <div className={`mb-4 ${styles.nextRaceHero}`}>
            {nextRace ? (
              <>
                <div>
                  <div className={styles.nextRaceLabel}>Next Race</div>
                  <div className={styles.nextRaceTrack}>
                    {NameMapper.fromTrackId(nextRace.track, lists?.tracks?.list)}
                  </div>
                  <div className={styles.nextRaceMeta}>
                    <span>{format(new Date(nextRace.date), 'EEEE, MMMM d')}</span>
                    <span>&middot;</span>
                    <span>{format(new Date(nextRace.date), 'p')} CT</span>
                  </div>
                </div>
                {daysUntil !== null && (
                  <div className={styles.countdown}>
                    <div className={styles.countdownNumber}>{daysUntil}</div>
                    <div className={styles.countdownLabel}>
                      {daysUntil === 1 ? 'day' : 'days'} away
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div>
                <div className={styles.nextRaceLabel}>Season in Progress</div>
                <div className={styles.nextRaceTrack} style={{ fontSize: '1.1rem' }}>
                  All scheduled races complete
                </div>
              </div>
            )}
          </div>

          <Row className="g-4">
            {/* Championship Standings — full list */}
            <Col md={7}>
              <div className={styles.standingsSection}>
                <div className={styles.standingsHeader}>Championship Standings</div>
                {standings?.length ? (
                  standings.map((driver, i, arr) => renderStandingsRow(driver, i, arr))
                ) : (
                  <p className="text-muted text-center py-4 small mb-0">
                    Standings will appear after the first race
                  </p>
                )}
              </div>
            </Col>

            {/* Right column: recent race + season progress */}
            <Col md={5}>
              {(() => {
                  const race = recentRaces?.[0];
                  const canLink = !showRecentRacesSpinner && race && onSwitchToSchedule;
                  return (
                <div
                  className={`${styles.standingsSection} ${canLink ? styles.standingsSectionLink : ''} mb-3`}
                  onClick={canLink ? () => onSwitchToSchedule(race.id) : undefined}
                  role={canLink ? 'button' : undefined}
                  tabIndex={canLink ? 0 : undefined}
                  onKeyDown={canLink ? (e) => e.key === 'Enter' && onSwitchToSchedule(race.id) : undefined}
                >
                <div className={`${styles.standingsHeader} ${styles.standingsHeaderWithLink}`}>
                  <span>Most Recent Race</span>
                  {canLink && <span className={styles.standingsHeaderArrow}>›</span>}
                </div>
                {showRecentRacesSpinner ? (
                  <div className="text-center p-3">
                    <Spinner size="sm" animation="border" />
                  </div>
                ) : race ? (() => {
                  const results = recentRaceResults[race.id];
                  return (
                    <div className="p-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong className="small">
                          {NameMapper.fromTrackId(race.setup.TrackId, lists?.tracks?.list)}
                        </strong>
                        <small className="text-muted">
                          {format((new Date(0)).setUTCSeconds(race.start_time), 'MMM d')}
                        </small>
                      </div>
                      {results ? (
                        <>
                          <div className={`${styles.winnerHighlight} mb-1`}>
                            <BsTrophy className="me-2" size={12} />
                            {results.find(r => r.RacePosition === 1)?.name}
                          </div>
                          <div className="d-flex gap-3 small text-muted mt-1">
                            <span>P2 {results.find(r => r.RacePosition === 2)?.name}</span>
                            <span>P3 {results.find(r => r.RacePosition === 3)?.name}</span>
                          </div>
                        </>
                      ) : (
                        <small className="text-muted">Loading results...</small>
                      )}
                    </div>
                  );
                })() : (
                  <p className="text-muted text-center py-3 small mb-0">
                    No races completed yet
                  </p>
                )}
              </div>
                  );
              })()}

              <div className={styles.standingsSection}>
                <div className={styles.standingsHeader}>Season Progress</div>
                <div className="p-3">
                  <ProgressBar
                    now={league?.races?.length
                      ? (league.races.filter(r => r.completed).length / league.races.length) * 100
                      : 0
                    }
                    className="mb-2"
                  />
                  <div className="small text-muted text-center">
                    {league?.races?.filter(r => r.completed).length ?? 0} / {league?.races?.length ?? 0} races complete
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default LeagueDescriptionOverview;
