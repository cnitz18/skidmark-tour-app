import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Spinner } from 'react-bootstrap';
import PageHeader from '../../shared/PageHeader';
import postAPIData from '../../../utils/postAPIData';
import styles from './CreateLeague.module.css';

// ── Default points tables ──────────────────────────────────────────────────
const DEFAULTS = {
    standard: [
        { position: 1, points: 10 },
        { position: 2, points: 8 },
        { position: 3, points: 6 },
        { position: 4, points: 5 },
        { position: 5, points: 4 },
        { position: 6, points: 3 },
        { position: 7, points: 2 },
        { position: 8, points: 1 },
    ],
    feature: [
        { position: 1, points: 14 },
        { position: 2, points: 11 },
        { position: 3, points: 9 },
        { position: 4, points: 7 },
        { position: 5, points: 5 },
        { position: 6, points: 4 },
        { position: 7, points: 3 },
        { position: 8, points: 2 },
    ],
    sprint: [
        { position: 1, points: 6 },
        { position: 2, points: 5 },
        { position: 3, points: 4 },
        { position: 4, points: 3 },
        { position: 5, points: 2 },
        { position: 6, points: 1 },
    ],
    endurance: [
        { position: 1,  points: 25 },
        { position: 2,  points: 20 },
        { position: 3,  points: 16 },
        { position: 4,  points: 13 },
        { position: 5,  points: 10 },
        { position: 6,  points: 8 },
        { position: 7,  points: 6 },
        { position: 8,  points: 4 },
        { position: 9,  points: 2 },
        { position: 10, points: 1 },
    ],
};

const RACE_TYPES = ['standard', 'feature', 'sprint', 'endurance'];

const TYPE_LABELS = {
    standard:  'Standard',
    feature:   'Feature',
    sprint:    'Sprint',
    endurance: 'Endurance',
};

const TYPE_COLORS = {
    standard:  'var(--color-secondary)',
    feature:   'var(--color-accent)',
    sprint:    'var(--color-success)',
    endurance: 'var(--color-danger)',
};

const getCurrentLocalDateTime = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

// ── Component ──────────────────────────────────────────────────────────────
const CreateLeague = ({ lists }) => {
    const navigate = useNavigate();

    // Basic info
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imgUrl, setImgUrl] = useState('');
    const [completed, setCompleted] = useState(false);

    // Which scoring sections are open (accordion)
    const [openSections, setOpenSections] = useState({ info: true, scoring: true, calendar: true });

    // Scoring: which types are enabled and their rows
    const [enabledTypes, setEnabledTypes] = useState({ standard: true, feature: false, sprint: false, endurance: false });
    const [scoringRows, setScoringRows] = useState({
        standard:  DEFAULTS.standard.map(r => ({ ...r })),
        feature:   DEFAULTS.feature.map(r => ({ ...r })),
        sprint:    DEFAULTS.sprint.map(r => ({ ...r })),
        endurance: DEFAULTS.endurance.map(r => ({ ...r })),
    });
    // Which types earn the fastest-lap bonus
    const [flTypes, setFlTypes] = useState({ standard: false, feature: true, sprint: false, endurance: false });

    // Calendar
    const defaultTrackId = parseInt(lists?.tracks?.list?.[0]?.id ?? 0);
    const [races, setRaces] = useState([{ track: defaultTrackId, date: getCurrentLocalDateTime(), race_type: 'standard' }]);

    const [saving, setSaving] = useState(false);

    // ── Validation ──────────────────────────────────────────────────────────
    const isValid = useCallback(() => {
        if (!name.trim() || !description.trim()) return false;
        const anyEnabled = RACE_TYPES.some(t => enabledTypes[t]);
        if (!anyEnabled) return false;
        for (const t of RACE_TYPES) {
            if (!enabledTypes[t]) continue;
            const rows = scoringRows[t];
            if (rows.length === 0) return false;
            if (rows.some(r => !r.position || r.position <= 0 || !r.points || r.points <= 0)) return false;
        }
        if (races.length === 0) return false;
        if (races.some(r => !r.track || !r.date)) return false;
        return true;
    }, [name, description, enabledTypes, scoringRows, races]);

    const [formValid, setFormValid] = useState(false);
    useEffect(() => { setFormValid(isValid()); }, [isValid]);

    // ── Scoring helpers ─────────────────────────────────────────────────────
    const toggleType = (type) => {
        setEnabledTypes(prev => ({ ...prev, [type]: !prev[type] }));
    };

    const updateRow = (type, idx, field, value) => {
        setScoringRows(prev => {
            const rows = prev[type].map((r, i) => i === idx ? { ...r, [field]: parseInt(value) || 0 } : r);
            return { ...prev, [type]: rows };
        });
    };

    const addRow = (type) => {
        setScoringRows(prev => {
            const rows = [...prev[type]];
            const nextPos = rows.length > 0 ? Math.max(...rows.map(r => r.position)) + 1 : 1;
            return { ...prev, [type]: [...rows, { position: nextPos, points: 1 }] };
        });
    };

    const removeRow = (type, idx) => {
        setScoringRows(prev => {
            const rows = prev[type].filter((_, i) => i !== idx);
            return { ...prev, [type]: rows };
        });
    };

    // ── Calendar helpers ────────────────────────────────────────────────────
    const addRace = () => {
        setRaces(prev => [...prev, { track: defaultTrackId, date: getCurrentLocalDateTime(), race_type: 'standard' }]);
    };

    const updateRace = (idx, field, value) => {
        setRaces(prev => prev.map((r, i) => i === idx ? { ...r, [field]: field === 'track' ? parseInt(value) : value } : r));
    };

    const removeRace = (idx) => {
        setRaces(prev => prev.filter((_, i) => i !== idx));
    };

    // ── Section toggle ──────────────────────────────────────────────────────
    const toggleSection = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

    // ── Submit ──────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!formValid || saving) return;
        setSaving(true);

        // Build unified points array with race_type per row
        const points = RACE_TYPES.flatMap(type =>
            enabledTypes[type]
                ? scoringRows[type].map(r => ({ ...r, race_type: type }))
                : []
        );

        // fastestLapRaceTypes: list of enabled types that have fl bonus on
        const fastestLapRaceTypesList = RACE_TYPES.filter(t => enabledTypes[t] && flTypes[t]);

        const payload = {
            name: name.trim(),
            description: description.trim(),
            img: imgUrl.trim() || null,
            completed,
            extraPointForFastestLap: fastestLapRaceTypesList.length > 0,
            fastestLapRaceTypes: fastestLapRaceTypesList.length > 0 ? fastestLapRaceTypesList : null,
            points,
            races: races.map(r => ({ ...r, date: new Date(r.date).toISOString() })),
        };

        try {
            await postAPIData('/leagues/create/', payload);
            navigate('/leagueadmin');
        } catch (err) {
            console.error('Failed to create league:', err);
            setSaving(false);
        }
    };

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <Container className={`motion-fade-in ${styles.page}`}>
            <PageHeader title="Create New League" subtitle="Configure scoring, calendar, and settings" />

            {/* ── Section 1: Basic Info ── */}
            <div className={styles.section}>
                <div className={styles.sectionHeader} onClick={() => toggleSection('info')}>
                    <span className={styles.sectionTitle}>Basic Info</span>
                    <span className={`${styles.sectionChevron} ${openSections.info ? styles.sectionChevronOpen : ''}`}>▼</span>
                </div>
                {openSections.info && (
                    <div className={styles.sectionBody}>
                        <Form.Group className="mb-3">
                            <div className={styles.fieldLabel}>League Name *</div>
                            <Form.Control
                                placeholder="e.g. Winter 2026 Championship"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <div className={styles.fieldLabel}>Description *</div>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Brief summary of this season"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <div className={styles.fieldLabel}>Banner Image URL</div>
                            <Form.Control
                                placeholder="https://…"
                                value={imgUrl}
                                onChange={e => setImgUrl(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Check
                            type="checkbox"
                            label="Mark as completed"
                            checked={completed}
                            onChange={e => setCompleted(e.target.checked)}
                        />
                    </div>
                )}
            </div>

            {/* ── Section 2: Scoring Setup ── */}
            <div className={styles.section}>
                <div className={styles.sectionHeader} onClick={() => toggleSection('scoring')}>
                    <span className={styles.sectionTitle}>Scoring Setup</span>
                    <span className={`${styles.sectionChevron} ${openSections.scoring ? styles.sectionChevronOpen : ''}`}>▼</span>
                </div>
                {openSections.scoring && (
                    <div className={styles.sectionBody}>
                        {/* Race type enable toggles */}
                        <div className={styles.fieldLabel} style={{ marginBottom: '0.5rem' }}>Active race types</div>
                        <div className={styles.raceTypeTabs}>
                            {RACE_TYPES.map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    className={`${styles.raceTypeTab} ${enabledTypes[type] ? styles.raceTypeTabActive : ''}`}
                                    style={enabledTypes[type] ? { background: TYPE_COLORS[type], borderColor: TYPE_COLORS[type] } : {}}
                                    onClick={() => toggleType(type)}
                                >
                                    <span
                                        className={styles.raceTypeTabDot}
                                        style={enabledTypes[type] ? { background: '#fff' } : { background: TYPE_COLORS[type] }}
                                    />
                                    {TYPE_LABELS[type]}
                                </button>
                            ))}
                        </div>

                        {/* Points tables for enabled types */}
                        <div className={styles.scoringGrid}>
                            {RACE_TYPES.filter(t => enabledTypes[t]).map(type => (
                                <div key={type} className={styles.scoringCard}>
                                    <div className={styles.scoringCardHeader}>
                                        <span className={styles.scoringCardTitle} style={{ color: TYPE_COLORS[type] }}>
                                            {TYPE_LABELS[type]}
                                        </span>
                                    </div>
                                    <div className={styles.scoringCardBody}>
                                        {scoringRows[type].map((row, idx) => (
                                            <div key={idx} className={styles.scoringRow}>
                                                <span className={styles.scoringRowLabel}>P{idx + 1}</span>
                                                <Form.Control
                                                    size="sm"
                                                    type="number"
                                                    min={1}
                                                    className={styles.scoringRowInput}
                                                    value={row.points}
                                                    onChange={e => updateRow(type, idx, 'points', e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    className={styles.removeBtn}
                                                    onClick={() => removeRow(type, idx)}
                                                    title="Remove row"
                                                >✕</button>
                                            </div>
                                        ))}
                                        <button type="button" className={styles.addBtn} onClick={() => addRow(type)}>
                                            + Add position
                                        </button>
                                        <label className={styles.flCheckbox}>
                                            <Form.Check
                                                type="checkbox"
                                                checked={flTypes[type]}
                                                onChange={e => setFlTypes(prev => ({ ...prev, [type]: e.target.checked }))}
                                            />
                                            Fastest lap +1
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {!RACE_TYPES.some(t => enabledTypes[t]) && (
                            <p className="text-muted small text-center mt-2 mb-0">Enable at least one race type above.</p>
                        )}
                    </div>
                )}
            </div>

            {/* ── Section 3: Event Calendar ── */}
            <div className={styles.section}>
                <div className={styles.sectionHeader} onClick={() => toggleSection('calendar')}>
                    <span className={styles.sectionTitle}>Event Calendar ({races.length} round{races.length !== 1 ? 's' : ''})</span>
                    <span className={`${styles.sectionChevron} ${openSections.calendar ? styles.sectionChevronOpen : ''}`}>▼</span>
                </div>
                {openSections.calendar && (
                    <div className={styles.sectionBody}>
                        {races.map((race, idx) => (
                            <div key={idx} className={styles.calendarRow}>
                                <div>
                                    {idx === 0 && <div className={styles.fieldLabel}>Track</div>}
                                    <Form.Select
                                        value={race.track}
                                        onChange={e => updateRace(idx, 'track', e.target.value)}
                                    >
                                        {lists?.tracks?.list?.map(track => (
                                            <option key={track.id} value={track.id}>{track.name}</option>
                                        ))}
                                    </Form.Select>
                                </div>
                                <div>
                                    {idx === 0 && <div className={styles.fieldLabel}>Date &amp; Time</div>}
                                    <Form.Control
                                        type="datetime-local"
                                        value={race.date}
                                        onChange={e => updateRace(idx, 'date', e.target.value)}
                                    />
                                </div>
                                <div>
                                    {idx === 0 && <div className={styles.fieldLabel}>Type</div>}
                                    <Form.Select
                                        value={race.race_type || 'standard'}
                                        onChange={e => updateRace(idx, 'race_type', e.target.value)}
                                        style={{ minWidth: '105px' }}
                                    >
                                        {RACE_TYPES.map(t => (
                                            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                                        ))}
                                    </Form.Select>
                                </div>
                                <div style={idx === 0 ? { paddingTop: '1.55rem' } : {}}>
                                    <button
                                        type="button"
                                        className={styles.removeBtn}
                                        onClick={() => removeRace(idx)}
                                        title="Remove round"
                                        disabled={races.length === 1}
                                    >✕</button>
                                </div>
                            </div>
                        ))}
                        <button type="button" className={styles.addBtn} onClick={addRace}>
                            + Add round
                        </button>
                    </div>
                )}
            </div>

            {/* ── Actions ── */}
            <div className={styles.actions}>
                <Button variant="outline-secondary" onClick={() => navigate('/leagueadmin')}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={!formValid || saving}
                >
                    {saving ? <><Spinner size="sm" animation="border" className="me-2" />Saving…</> : 'Save League'}
                </Button>
            </div>
        </Container>
    );
};

export default CreateLeague;
