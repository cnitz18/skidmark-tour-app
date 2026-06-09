import { format } from 'date-fns';
import NameMapper from '../../utils/Classes/NameMapper';
import styles from './LeagueDescriptionRules.module.css';

const TYPE_LABELS = {
    standard:  'Standard Race',
    feature:   'Feature Race',
    sprint:    'Sprint',
    endurance: 'Endurance Race',
};

const TYPE_COLORS = {
    standard:  'var(--color-secondary)',
    feature:   'var(--color-accent)',
    sprint:    'var(--color-success)',
    endurance: 'var(--color-danger)',
};

const KNOWN_TYPES = ['standard', 'feature', 'sprint', 'endurance'];

const LeagueDescriptionRules = ({ league, lists }) => {
    if (!league) return null;

    // Sort points and collect unique race types in the canonical order
    const allPoints = [...(league.points || [])].sort((a, b) => a.position - b.position);
    const presentTypes = KNOWN_TYPES.filter(t => allPoints.some(p => (p.race_type || 'feature') === t));
    // Any unrecognised types appended after
    [...new Set(allPoints.map(p => p.race_type || 'feature'))]
        .filter(t => !KNOWN_TYPES.includes(t))
        .forEach(t => presentTypes.push(t));
    const hasMultipleTypes = presentTypes.length > 1;

    const sortedRaces = [...(league.races || [])].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Fastest-lap bonus display
    const flTypes = league.fastestLapRaceTypes;  // null = legacy
    const flText = (() => {
        if (!league.extraPointForFastestLap) return 'No bonus point for fastest lap';
        if (flTypes && flTypes.length > 0) {
            const labels = flTypes.map(t => TYPE_LABELS[t] ?? t).join(', ');
            return `+1 bonus point for fastest lap (${labels})`;
        }
        return '+1 bonus point awarded for fastest lap (feature races)';
    })();

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
                        <div className={styles.multiTypeGrid}>
                            {presentTypes.map(type => {
                                const rows = allPoints.filter(p => (p.race_type || 'feature') === type);
                                const color = TYPE_COLORS[type];
                                return (
                                    <div key={type}>
                                        <div className={styles.raceTypeLabel} style={color ? { color } : {}}>
                                            {TYPE_LABELS[type] ?? `${type} race`}
                                        </div>
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
                    <span>{flText}</span>
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
                            {race.race_type && (
                                <span
                                    className={styles.raceTypeBadge}
                                    style={{ color: TYPE_COLORS[race.race_type] ?? 'var(--color-text-secondary)' }}
                                >
                                    {TYPE_LABELS[race.race_type] ?? race.race_type}
                                </span>
                            )}
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
