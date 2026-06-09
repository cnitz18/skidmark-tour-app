import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import NameMapper from "../../utils/Classes/NameMapper";
import styles from "./FeaturedLeagueCard.module.css";

const getTrackDisplayName = (trackValue, trackList) => {
    const normalizeTrackLabel = (value) => String(value)
        .replaceAll('_', ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (trackValue === null || trackValue === undefined || trackValue === '') return 'TBA';

    const asNumber = Number(trackValue);
    if (!Number.isNaN(asNumber)) {
        const mapped = (
            NameMapper.fromTrackId(asNumber, trackList) ||
            NameMapper.fromTrackId(String(trackValue), trackList) ||
            'TBA'
        );
        return mapped === 'TBA' ? mapped : normalizeTrackLabel(mapped);
    }

    return normalizeTrackLabel(NameMapper.fromTrackApiName(String(trackValue)));
};

const getReadableRaceDate = (dateValue) => {
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return 'Date TBA';
    return parsed.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const FeaturedLeagueCard = ({ league, standings, tracksList, compact = false }) => {
    const entries = standings?.scoreboard_entries;
    const nextRace = league?.races?.[0];
    const completedCount = (league?.races || []).filter(r => r.completed).length;
    const totalCount = league?.races?.length || 0;

    return (
        <div className={`${styles.heroCard} ${compact ? styles.compact : ''}`}>
            <div
                className={styles.heroBackground}
                style={{ backgroundImage: `url(${league?.img || '/opala-86-1920.jpg'})` }}
            >
                <div className={styles.heroOverlay} />
            </div>
            <div className={styles.heroContent}>
                <div className={styles.heroHeader}>
                    <h2 className={styles.heroTitle}>{league?.name}</h2>
                    <p className={styles.heroSubtitle}>{league?.description || 'The latest racing season'}</p>
                </div>

                <div className={styles.standingsBox}>
                    <div className={styles.standingsLabel}>Championship Leaders</div>
                    {[0, 1, 2].map((idx) => {
                        const entry = entries?.[idx];
                        return (
                            <div key={idx} className={styles.standingRow}>
                                <span className={styles.medal}>{['🥇', '🥈', '🥉'][idx]}</span>
                                {entry ? (
                                    <>
                                        <span className={styles.driver}>{entry.PlayerName}</span>
                                        <span className={styles.points}>{entry.Points} pts</span>
                                    </>
                                ) : (
                                    <span className={`${styles.driver} ${styles.driverSkeleton}`}>&nbsp;</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className={styles.infoStrip}>
                    <span className={styles.stripItem}>
                        <span className={styles.stripLabel}>Next Race</span>
                        {nextRace
                            ? `${getTrackDisplayName(nextRace.track, tracksList)} | ${getReadableRaceDate(nextRace.date)}`
                            : 'No races scheduled'}
                    </span>
                    <span className={styles.stripSep}>·</span>
                    <span className={styles.stripItem}>
                        <span className={styles.stripLabel}>Progress</span>
                        {`${completedCount}/${totalCount} races`}
                    </span>
                </div>

                <div className={styles.heroFooter}>
                    <Button
                        as={Link}
                        to={`/league/${league?.id}`}
                        state={{ league }}
                        variant="primary"
                        size="lg"
                        className={styles.viewBtn}
                    >
                        League Details →
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default FeaturedLeagueCard;
