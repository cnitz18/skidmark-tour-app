import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, Row, Col, Form, Button, Spinner, Table } from "react-bootstrap";
import Select from "react-select";
import getAPIData from "../../utils/getAPIData";
import styles from "./ScreenshotParser.module.css";

const ResultsReviewForm = ({ formData, setFormData, lists, onGenerateSQL, onBack, isProcessing }) => {
  const [activeSession, setActiveSession] = useState(0);
  const [leagues, setLeagues] = useState([]);
  const [leaguePlayers, setLeaguePlayers] = useState([]);
  const [loadingLeagues, setLoadingLeagues] = useState(true);
  const [loadingLeaguePlayers, setLoadingLeaguePlayers] = useState(false);

  // Fetch leagues on mount
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const data = await getAPIData('/leagues/get/');
        setLeagues(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch leagues:', err);
      } finally {
        setLoadingLeagues(false);
      }
    };

    fetchLeagues();
  }, []);

  // Fetch league players when league is selected
  useEffect(() => {
    const fetchLeaguePlayers = async () => {
      if (!formData.leagueId) {
        setLeaguePlayers([]);
        return;
      }

      setLoadingLeaguePlayers(true);
      try {
        const data = await getAPIData(`/leagues/get/stats/?id=${formData.leagueId}`);
        if (data && data.scoreboard_entries) {
          // Extract unique player names from scoreboard, filtering out empty names
          const players = data.scoreboard_entries
            .filter(entry => entry.PlayerName && entry.PlayerName.trim() !== '')
            .map(entry => ({
              name: entry.PlayerName.trim(),
              position: entry.Position,
              points: entry.Points
            }));
          setLeaguePlayers(players);
          console.log('League players loaded:', players);
        }
      } catch (err) {
        console.error('Failed to fetch league players:', err);
      } finally {
        setLoadingLeaguePlayers(false);
      }
    };

    fetchLeaguePlayers();
  }, [formData.leagueId]);

  // Update form field
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, [setFormData]);

  // Override the session type for a session (Race / Qualifying / Practice)
  const updateSessionType = useCallback((sessionIndex, newType) => {
    setFormData(prev => {
      const newSessions = [...prev.sessions];
      newSessions[sessionIndex] = { ...newSessions[sessionIndex], sessionType: newType };
      return { ...prev, sessions: newSessions };
    });
  }, [setFormData]);

  // Update a result in a session
  const updateResult = useCallback((sessionIndex, resultIndex, field, value) => {
    setFormData(prev => {
      const newSessions = [...prev.sessions];
      const newResults = [...newSessions[sessionIndex].results];
      newResults[resultIndex] = {
        ...newResults[resultIndex],
        [field]: value
      };
      const updatedSession = {
        ...newSessions[sessionIndex],
        results: newResults
      };
      // Keep humanPlayerCount in sync when isAI changes
      if (field === 'isAI') {
        updatedSession.humanPlayerCount = newResults.filter(r => !r.isAI).length;
      }
      newSessions[sessionIndex] = updatedSession;
      return { ...prev, sessions: newSessions };
    });
  }, [setFormData]);

  // Add a blank result row to a session
  const addResult = useCallback((sessionIndex) => {
    setFormData(prev => {
      const newSessions = [...prev.sessions];
      const session = newSessions[sessionIndex];
      const newResults = [...(session.results || []), {
        position: (session.results?.length || 0) + 1,
        driverName: '',
        isAI: false,
        bestLapMs: null,
        bestLapStr: '',
        totalTimeMs: null,
        totalTimeStr: '',
        sector1Ms: null, sector1Str: null,
        sector2Ms: null, sector2Str: null,
        sector3Ms: null, sector3Str: null,
        pitStops: null,
        gapMs: null,
        gapStr: null,
        confidence: 1.0
      }];
      newSessions[sessionIndex] = {
        ...session,
        results: newResults,
        gridSize: newResults.length,
        humanPlayerCount: newResults.filter(r => !r.isAI).length
      };
      return { ...prev, sessions: newSessions };
    });
  }, [setFormData]);

  // Delete a result row from a session
  const deleteResult = useCallback((sessionIndex, resultIndex) => {
    setFormData(prev => {
      const newSessions = [...prev.sessions];
      const session = newSessions[sessionIndex];
      const newResults = session.results
        .filter((_, i) => i !== resultIndex)
        .map((r, i) => ({ ...r, position: i + 1 }));
      newSessions[sessionIndex] = {
        ...session,
        results: newResults,
        gridSize: newResults.length,
        humanPlayerCount: newResults.filter(r => !r.isAI).length
      };
      return { ...prev, sessions: newSessions };
    });
  }, [setFormData]);

  // Normalize a name for comparison (remove special chars, lowercase)
  const normalizeName = useCallback((name) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/[._\-\s]/g, '')  // Remove periods, underscores, dashes, spaces
      .replace(/\(a[il]\)$/i, '') // Remove (AI) or (Al) suffix
      .trim();
  }, []);

  // Check if driver name matches an existing player from league standings
  const findPlayerMatch = useCallback((driverName) => {
    if (!driverName || leaguePlayers.length === 0) return null;
    
    const normalizedDriver = normalizeName(driverName);
    if (!normalizedDriver) return null; // Skip if normalized name is empty
    
    // First try exact normalized match
    const exactMatch = leaguePlayers.find(p => {
      const normalizedPlayer = normalizeName(p.name);
      return normalizedPlayer && normalizedPlayer === normalizedDriver;
    });
    if (exactMatch) return { ...exactMatch, matchType: 'exact' };
    
    // Then try "contains" match (for partial OCR reads)
    const containsMatch = leaguePlayers.find(p => {
      const normalizedPlayer = normalizeName(p.name);
      if (!normalizedPlayer) return false;
      return normalizedPlayer.includes(normalizedDriver) || normalizedDriver.includes(normalizedPlayer);
    });
    if (containsMatch) return { ...containsMatch, matchType: 'partial' };
    
    // Finally try similarity matching (for OCR errors)
    // Simple Levenshtein-ish approach: count matching characters
    let bestMatch = null;
    let bestScore = 0;
    
    for (const player of leaguePlayers) {
      const normalizedPlayer = normalizeName(player.name);
      if (!normalizedPlayer) continue; // Skip empty names
      if (Math.abs(normalizedPlayer.length - normalizedDriver.length) > 3) continue;
      
      // Count matching characters in sequence
      let matches = 0;
      let j = 0;
      for (let i = 0; i < normalizedDriver.length && j < normalizedPlayer.length; i++) {
        if (normalizedDriver[i] === normalizedPlayer[j]) {
          matches++;
          j++;
        } else if (j > 0 && normalizedDriver[i] === normalizedPlayer[j - 1]) {
          // Allow for inserted characters
        } else {
          j++;
          i--;
        }
      }
      
      const score = matches / Math.max(normalizedDriver.length, normalizedPlayer.length);
      if (score > 0.7 && score > bestScore) {
        bestScore = score;
        bestMatch = player;
      }
    }
    
    if (bestMatch) return { ...bestMatch, matchType: 'fuzzy', score: bestScore };
    
    return null;
  }, [leaguePlayers, normalizeName]);

  // Handle form submission
  const handleSubmit = useCallback(() => {
    // Validate required fields
    if (!formData.trackId) {
      alert('Please select a track');
      return;
    }
    if (!formData.vehicleClassId) {
      alert('Please select a vehicle class');
      return;
    }
    if (!formData.vehicleModelId) {
      alert('Please select a vehicle model');
      return;
    }
    if (!formData.raceDate) {
      alert('Please enter a race date');
      return;
    }

    onGenerateSQL(formData);
  }, [formData, onGenerateSQL]);

  const currentSession = formData.sessions[activeSession];

  // Custom styles for react-select to match light theme
  const selectStyles = useMemo(() => ({
    control: (base, state) => ({
      ...base,
      backgroundColor: '#fff',
      borderColor: state.isFocused ? '#ffc107' : '#ced4da',
      boxShadow: state.isFocused ? '0 0 0 0.25rem rgba(255, 193, 7, 0.25)' : 'none',
      '&:hover': { borderColor: '#ffc107' },
      minHeight: '38px',
      borderRadius: '6px',
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: '#fff',
      border: '1px solid #dee2e6',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      zIndex: 9999,
    }),
    menuList: (base) => ({
      ...base,
      maxHeight: '200px',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#ffc107' : state.isFocused ? '#f8f9fa' : '#fff',
      color: state.isSelected ? '#212529' : '#495057',
      '&:active': { backgroundColor: '#ffc107' },
    }),
    singleValue: (base) => ({
      ...base,
      color: '#212529',
    }),
    input: (base) => ({
      ...base,
      color: '#212529',
    }),
    placeholder: (base) => ({
      ...base,
      color: '#adb5bd',
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: '#dee2e6',
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: '#6c757d',
      '&:hover': { color: '#212529' },
    }),
    clearIndicator: (base) => ({
      ...base,
      color: '#6c757d',
      '&:hover': { color: '#212529' },
    }),
  }), []);

  // Prepare options for react-select dropdowns
  const leagueOptions = useMemo(() => 
    [...leagues].sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(league => ({
      value: league.id,
      label: league.name
    })),
  [leagues]);

  const trackOptions = useMemo(() => 
    [...(lists.tracks?.list || [])].sort((a, b) => a.name.localeCompare(b.name)).map(track => ({
      value: track.id,
      label: track.name.replace(/_/g, ' ')
    })),
  [lists.tracks]);

  const vehicleClassOptions = useMemo(() => 
    [...(lists.vehicle_classes?.list || [])].sort((a, b) => 
      (a.translated_name || a.name).localeCompare(b.translated_name || b.name)
    ).map(vc => ({
      value: vc.value,
      label: vc.translated_name || vc.name
    })),
  [lists.vehicle_classes]);

  const vehicleModelOptions = useMemo(() => 
    [...(lists.vehicles?.list || [])].sort((a, b) => a.name.localeCompare(b.name)).map(v => ({
      value: v.id,
      label: v.name
    })),
  [lists.vehicles]);

  return (
    <>
      {/* Metadata Card */}
      <Card className={`${styles.reviewCard} mb-4`}>
        <Card.Header>
          <h5 className="mb-0">📅 Race Details</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className={styles.formLabel}>League (Optional)</Form.Label>
                <Select
                  styles={selectStyles}
                  options={leagueOptions}
                  value={leagueOptions.find(opt => opt.value === formData.leagueId) || null}
                  onChange={(selected) => updateField('leagueId', selected ? selected.value : null)}
                  isDisabled={loadingLeagues}
                  isClearable
                  placeholder="-- Non-League Race --"
                  noOptionsMessage={() => "No leagues found"}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className={styles.formLabel}>Track *</Form.Label>
                <Select
                  styles={selectStyles}
                  options={trackOptions}
                  value={trackOptions.find(opt => opt.value === formData.trackId) || null}
                  onChange={(selected) => updateField('trackId', selected ? selected.value : null)}
                  isClearable
                  placeholder="-- Select Track --"
                  noOptionsMessage={() => "No tracks found"}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className={styles.formLabel}>Vehicle Class *</Form.Label>
                <Select
                  styles={selectStyles}
                  options={vehicleClassOptions}
                  value={vehicleClassOptions.find(opt => opt.value === formData.vehicleClassId) || null}
                  onChange={(selected) => updateField('vehicleClassId', selected ? selected.value : null)}
                  isClearable
                  placeholder="-- Select Vehicle Class --"
                  noOptionsMessage={() => "No vehicle classes found"}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className={styles.formLabel}>Vehicle Model *</Form.Label>
                <Select
                  styles={selectStyles}
                  options={vehicleModelOptions}
                  value={vehicleModelOptions.find(opt => opt.value === formData.vehicleModelId) || null}
                  onChange={(selected) => updateField('vehicleModelId', selected ? selected.value : null)}
                  isClearable
                  placeholder="-- Select Vehicle --"
                  noOptionsMessage={() => "No vehicles found"}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className={styles.formLabel}>Race Date/Time *</Form.Label>
                <Form.Control
                  type="datetime-local"
                  className={styles.formControl}
                  value={formData.raceDate}
                  onChange={(e) => updateField('raceDate', e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className={styles.formLabel}>Race Length (laps/minutes)</Form.Label>
                <Form.Control
                  type="number"
                  className={styles.formControl}
                  value={formData.raceLength}
                  onChange={(e) => updateField('raceLength', parseInt(e.target.value) || 0)}
                  min={0}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Session Results Card */}
      <Card className={styles.reviewCard}>
        <Card.Header>
          <h5 className="mb-0">🏁 Session Results</h5>
        </Card.Header>
        <Card.Body>
          {/* Session Tabs */}
          {formData.sessions.length > 1 && (
            <div className={styles.sessionTabs}>
              {formData.sessions.map((session, index) => (
                <button
                  key={index}
                  className={`${styles.sessionTab} ${activeSession === index ? styles.active : ''}`}
                  onClick={() => setActiveSession(index)}
                >
                  {session.sessionType} ({session.results?.length || 0} drivers)
                </button>
              ))}
            </div>
          )}

          {/* Session type override — lets the user fix a wrong OCR detection */}
          {currentSession && (
            <Row className="mb-3 align-items-center">
              <Col xs="auto">
                <small style={{ color: '#aaa' }}>Session type:</small>
              </Col>
              <Col xs="auto" className="ms-2">
                <Form.Select
                  size="sm"
                  value={currentSession.sessionType}
                  onChange={(e) => updateSessionType(activeSession, e.target.value)}
                  style={{ width: 'auto', display: 'inline-block' }}
                >
                  <option value="Race">Race</option>
                  <option value="Qualifying">Qualifying</option>
                  <option value="Practice">Practice</option>
                </Form.Select>
              </Col>
            </Row>
          )}

          {/* Results Table */}
          {currentSession && (
            <div className={styles.resultsTable}>
              <Table responsive>
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>POS</th>
                    <th>Driver</th>
                    <th style={{ width: '100px' }}>Best Lap</th>
                    <th style={{ width: '120px' }}>Total Time</th>
                    <th style={{ width: '80px' }}>AI?</th>
                    <th style={{ width: '100px' }}>Confidence</th>
                    <th style={{ width: '150px' }}>Player Match</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {currentSession.results?.map((result, index) => {
                    const playerMatch = findPlayerMatch(result.driverName);
                    const isLowConfidence = result.confidence < 0.7;
                    
                    return (
                      <tr key={index} className={isLowConfidence ? styles.lowConfidence : ''}>
                        <td>
                          <input
                            type="number"
                            value={result.position}
                            onChange={(e) => updateResult(activeSession, index, 'position', parseInt(e.target.value))}
                            min={1}
                            style={{ width: '50px' }}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={result.driverName}
                            onChange={(e) => updateResult(activeSession, index, 'driverName', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={result.bestLapStr || ''}
                            onChange={(e) => updateResult(activeSession, index, 'bestLapStr', e.target.value)}
                            placeholder="0:00.000"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={result.totalTimeStr || ''}
                            onChange={(e) => updateResult(activeSession, index, 'totalTimeStr', e.target.value)}
                            placeholder="00:00:00.000"
                          />
                        </td>
                        <td>
                          <Form.Check
                            type="checkbox"
                            checked={result.isAI}
                            onChange={(e) => updateResult(activeSession, index, 'isAI', e.target.checked)}
                          />
                        </td>
                        <td>
                          <span style={{ 
                            color: result.confidence >= 0.9 ? '#28a745' : 
                                   result.confidence >= 0.7 ? '#ffc107' : '#dc3545'
                          }}>
                            {(result.confidence * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td>
                          {result.isAI ? (
                            <span className={styles.aiIndicator + ' ' + styles.ai}>AI Driver</span>
                          ) : !formData.leagueId ? (
                            <span className={styles.playerNoMatch}>Select league</span>
                          ) : loadingLeaguePlayers ? (
                            <span className={styles.playerNoMatch}>Loading...</span>
                          ) : playerMatch ? (
                            <span className={styles.playerMatch} title={`Match type: ${playerMatch.matchType}`}>
                              ✓ {playerMatch.name}
                              {playerMatch.matchType === 'fuzzy' && <small> (~{Math.round(playerMatch.score * 100)}%)</small>}
                            </span>
                          ) : (
                            <span className={styles.playerNoMatch}>⚠ No match</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => deleteResult(activeSession, index)}
                            title="Delete row"
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#dc3545', fontSize: '16px', lineHeight: 1, padding: '2px 4px'
                            }}
                          >×</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}

          {/* Add Row */}
          {currentSession && (
            <div className="mt-2 mb-3">
              <Button
                variant="outline-warning"
                size="sm"
                onClick={() => addResult(activeSession)}
              >
                + Add Row
              </Button>
            </div>
          )}

          {/* Summary */}
          {currentSession && (
            <Row className="mt-1">
              <Col>
                <small style={{ color: '#888' }}>
                  <strong>Grid Size:</strong> {currentSession.results?.length || 0} | 
                  <strong> Human Players:</strong> {currentSession.results?.filter(r => !r.isAI).length || 0} | 
                  <strong> AI Drivers:</strong> {currentSession.results?.filter(r => r.isAI).length || 0}
                </small>
              </Col>
            </Row>
          )}

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <Button variant="outline-secondary" onClick={onBack}>
              ← Back
            </Button>
            <Button
              variant="success"
              size="lg"
              onClick={handleSubmit}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Generating...
                </>
              ) : (
                <>
                  ⚡ Generate SQL
                </>
              )}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </>
  );
};

export default ResultsReviewForm;
