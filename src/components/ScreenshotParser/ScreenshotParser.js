import { useState, useCallback } from "react";
import { Container, Row, Col, Alert } from "react-bootstrap";
import PageHeader from "../shared/PageHeader";
import ScreenshotUploader from "./ScreenshotUploader";
import ResultsReviewForm from "./ResultsReviewForm";
import SQLOutput from "./SQLOutput";
import styles from "./ScreenshotParser.module.css";

const ScreenshotParser = ({ enums, lists, embedded = false }) => {
  // Workflow state: 'upload' -> 'review' -> 'output'
  const [step, setStep] = useState('upload');
  
  // Parsed data from OCR
  // eslint-disable-next-line no-unused-vars
  const [parsedData, setParsedData] = useState(null);
  const [warnings, setWarnings] = useState([]);
  
  // Form data for SQL generation
  const [formData, setFormData] = useState({
    trackId: null,
    vehicleClassId: null,
    vehicleModelId: null,
    leagueId: null,
    raceDate: new Date().toISOString().slice(0, 16),
    raceLength: 0,
    sessions: []
  });
  
  // Generated SQL
  const [generatedSQL, setGeneratedSQL] = useState('');
  
  // Loading states
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Handle successful OCR parse
  const handleParseComplete = useCallback((data) => {
    setParsedData(data);
    setWarnings(data.warnings || []);
    
    // Pre-populate form data with parsed values
    const sessions = data.sessions || [];
    
    // Try to find vehicle class/model from parsed data
    let vehicleClass = null;
    let vehicleModel = null;
    for (const session of sessions) {
      if (session.vehicleClass) vehicleClass = session.vehicleClass;
      if (session.vehicleModel) vehicleModel = session.vehicleModel;
    }
    
    // Find matching IDs from lists
    let vehicleClassId = null;
    let vehicleModelId = null;
    
    if (vehicleClass && lists.vehicle_classes?.list) {
      const match = lists.vehicle_classes.list.find(
        vc => vc.name.toLowerCase() === vehicleClass.toLowerCase()
      );
      if (match) vehicleClassId = match.value;
    }
    
    if (vehicleModel && lists.vehicles?.list) {
      const match = lists.vehicles.list.find(
        v => v.name.toLowerCase() === vehicleModel.toLowerCase()
      );
      if (match) vehicleModelId = match.id;
    }
    
    // Calculate race length from winner's time in the Race session
    // Truncate to nearest 5 minute interval
    let raceLength = 0;
    const raceSession = sessions.find(s => s.sessionType === 'Race');
    if (raceSession && raceSession.results && raceSession.results.length > 0) {
      // Winner is position 1 (first result after sorting)
      const winner = raceSession.results.find(r => r.position === 1) || raceSession.results[0];
      if (winner && winner.totalTimeMs) {
        // Convert ms to minutes and truncate to nearest 5 min
        const totalMinutes = winner.totalTimeMs / 60000;
        raceLength = Math.floor(totalMinutes / 5) * 5;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      vehicleClassId,
      vehicleModelId,
      raceLength,
      sessions
    }));
    
    setStep('review');
  }, [lists]);

  // Handle SQL generation
  const handleGenerateSQL = useCallback(async (reviewedData) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await fetch(process.env.REACT_APP_AMS2API + '/api/ocr/generate-sql/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewedData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setGeneratedSQL(result.sql);
        setStep('output');
      } else {
        setError(result.error || 'Failed to generate SQL');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Reset to start over
  const handleReset = useCallback(() => {
    setStep('upload');
    setParsedData(null);
    setWarnings([]);
    setFormData({
      trackId: null,
      vehicleClassId: null,
      vehicleModelId: null,
      leagueId: null,
      raceDate: new Date().toISOString().slice(0, 16),
      raceLength: 0,
      sessions: []
    });
    setGeneratedSQL('');
    setError(null);
  }, []);

  const Wrapper = embedded ? 'div' : Container;
  const wrapperProps = embedded ? {} : { className: styles.container };

  return (
    <Wrapper {...wrapperProps}>
      {!embedded && (
        <PageHeader 
          title="Screenshot Parser" 
          subtitle="Upload race screenshots to generate SQL import scripts"
        />
      )}
      
      {/* Progress Steps */}
      <Row className="mb-4">
        <Col>
          <div className={styles.stepIndicator}>
            <div className={`${styles.step} ${step === 'upload' ? styles.active : ''} ${step !== 'upload' ? styles.completed : ''}`}>
              <span className={styles.stepNumber}>1</span>
              <span className={styles.stepLabel}>Upload</span>
            </div>
            <div className={styles.stepDivider} />
            <div className={`${styles.step} ${step === 'review' ? styles.active : ''} ${step === 'output' ? styles.completed : ''}`}>
              <span className={styles.stepNumber}>2</span>
              <span className={styles.stepLabel}>Review</span>
            </div>
            <div className={styles.stepDivider} />
            <div className={`${styles.step} ${step === 'output' ? styles.active : ''}`}>
              <span className={styles.stepNumber}>3</span>
              <span className={styles.stepLabel}>SQL Output</span>
            </div>
          </div>
        </Col>
      </Row>
      
      {/* Error Alert */}
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      
      {/* Warnings */}
      {warnings.length > 0 && step === 'review' && (
        <Alert variant="warning">
          <strong>OCR Warnings:</strong>
          <ul className="mb-0 mt-2">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </Alert>
      )}
      
      {/* Step Content */}
      {step === 'upload' && (
        <ScreenshotUploader 
          onParseComplete={handleParseComplete}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
          setError={setError}
        />
      )}
      
      {step === 'review' && (
        <ResultsReviewForm 
          formData={formData}
          setFormData={setFormData}
          lists={lists}
          onGenerateSQL={handleGenerateSQL}
          onBack={() => setStep('upload')}
          isProcessing={isProcessing}
        />
      )}
      
      {step === 'output' && (
        <SQLOutput 
          sql={generatedSQL}
          onReset={handleReset}
          onBack={() => setStep('review')}
        />
      )}
    </Wrapper>
  );
};

export default ScreenshotParser;
