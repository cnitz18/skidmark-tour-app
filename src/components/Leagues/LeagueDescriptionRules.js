import { format } from 'date-fns';
import NameMapper from '../../utils/Classes/NameMapper';
import styles from './LeagueDescriptionRules.module.css';

const LeagueDescriptionRules = ({ league, lists }) => {
    if (!league) return null;

    // Split points into race types (feature / sprint / untyped)
    const allPoints = [...(league.points || [])].sort((a, b) => a.position - b.position);
    const raceTypes = [...new Set(allPoints.map(p => p.race_type || 'feature'))];
    const hasMultipleTypes = raceTypes.length > 1;

    const sortedRaces = [...(league.races || [])].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
    );

    return (
        <div className="py-3">

            {/* ── Description ── */}
            {league.description && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>About This League</div>
                    <p className={styles.description}>{league.description}</p>
                </div>
            )}

            {/* ── Scoring System ── */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>Points System</div>

                {allPoints.length ? (
                    hasMultipleTypes ? (
                        <div className={styles.twoColGrid}>
                            {raceTypes.map(type => {
                                const rows = allPoints.filter(p => (p.race_type || 'feature') === type);
                                return (
                                    <div key={type}>
                                        <div className={styles.raceTypeLabel}>{type} race</div>
                                        <table className={styles.scoringTable}>
                                            <thead>
                                                <tr>
                                                    <th>Position</th>
                                                    <th>Points</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rows.map((p, i) => (
                                                    <tr key={i}>
                                                        <td className={styles.posCell}>
                                                            {NameMapper.positionFromNumber(p.position)}
                                                        </td>
                                                        <td className={styles.ptsCell}>{p.points}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <table className={styles.scoringTable} style={{ maxWidth: 280, margin: '0 auto' }}>
                            <thead>
                                <tr>
                                    <th>Position</th>
                                    <th>Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allPoints.map((p, i) => (
                                    <tr key={i}>
                                        <td className={styles.posCell}>
                                            {NameMapper.positionFromNumber(p.position)}
                                        </td>
                                        <td className={styles.ptsCell}>{p.points}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                ) : (
                    <p className="text-muted small text-center py-2 mb-0">No scoring data configured</p>
                )}

                <div className={styles.bonusRow} style={{ marginTop: '1rem' }}>
                    <span
                        className={`${styles.bonusDot} ${
                            league.extraPointForFastestLap ? styles.bonusDotOn : styles.bonusDotOff
                        }`}
                    />
                    <span>
                        {league.extraPointForFastestLap
                            ? '+1 bonus point awarded for fastest lap (feature races)'
                            : 'No bonus point for fastest lap'}
                    </span>
                </div>
            </div>

            {/* ── Race Calendar ── */}
            {sortedRaces.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        Race Calendar &mdash; {sortedRaces.length} rounds
                    </div>
                    {sortedRaces.map((race, i) => (
                        <div key={race.id} className={styles.raceRow}>
                            <span className={styles.raceNum}>R{i + 1}</span>
                            <span className={styles.raceName}>
                                {NameMapper.fromTrackApiName(
                                    NameMapper.fromTrackId(race.track, lists?.tracks?.list)
                                ) || `Track #${race.track}`}
                            </span>
                            <span className={styles.raceDate}>
                                {format(new Date(race.date), 'MMM d, yyyy')}
                            </span>
                            {race.completed && (
                                <span className={styles.raceCompleted}>✓</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LeagueDescriptionRules;
