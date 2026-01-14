import { useState, useCallback, useRef } from "react";
import { Card, Button, Spinner, Row, Col, Form } from "react-bootstrap";
import styles from "./ScreenshotParser.module.css";

const ScreenshotUploader = ({ onParseComplete, isProcessing, setIsProcessing, setError }) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = useCallback((newFiles) => {
    const imageFiles = Array.from(newFiles).filter(f => f.type.startsWith('image/'));
    
    // Create previews
    const newPreviews = imageFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));
    
    setFiles(prev => [...prev, ...imageFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInput = useCallback((e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) {
      setError('Please select at least one screenshot');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });
      
      // Add debug flag if enabled
      if (debugMode) {
        formData.append('debug', 'true');
      }

      const response = await fetch(process.env.REACT_APP_AMS2API + '/api/ocr/parse-screenshot/', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Log debug data to console if available
        if (result.debug) {
          console.log('=== OCR Debug Data ===');
          result.debug.forEach((d, i) => {
            console.log(`\n--- File ${i + 1}: ${d.filename} (${d.image_size.width}x${d.image_size.height}) ---`);
            console.log('Raw OCR results:');
            d.raw_ocr.forEach(item => {
              console.log(`  [${item.bbox.x_center.toFixed(0)}, ${item.bbox.y_center.toFixed(0)}] "${item.text}" (${(item.confidence * 100).toFixed(0)}%)`);
            });
          });
          console.log('=== End Debug Data ===');
        }
        onParseComplete(result);
      } else {
        setError(result.error || 'Failed to parse screenshots');
        if (result.traceback) {
          console.error('Server traceback:', result.traceback);
        }
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [files, debugMode, onParseComplete, setError, setIsProcessing]);

  return (
    <Card className={styles.reviewCard}>
      <Card.Header>
        <h5 className="mb-0">📷 Upload Race Screenshots</h5>
      </Card.Header>
      <Card.Body>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept="image/*"
          multiple
          style={{ display: 'none' }}
        />
        
        <div
          className={`${styles.uploadArea} ${isDragActive ? styles.dragActive : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <div className={styles.uploadIcon}>🖼️</div>
          <div className={styles.uploadText}>
            Drag & drop screenshots here, or click to browse
          </div>
          <div className={styles.uploadSubtext}>
            Supports PNG, JPG. Upload both Qualifying and Race screenshots for full data.
          </div>
        </div>

        {previews.length > 0 && (
          <>
            <h6 className="mt-4 mb-3" style={{ color: '#ffc107' }}>
              Selected Files ({previews.length})
            </h6>
            <div className={styles.previewContainer}>
              {previews.map((preview, index) => (
                <div key={index} className={styles.previewImage}>
                  <img src={preview.url} alt={preview.name} />
                  <button
                    className={styles.previewRemove}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    ×
                  </button>
                  <div className={styles.previewLabel}>{preview.name}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <Row className="mt-4 align-items-center">
          <Col>
            <Form.Check
              type="checkbox"
              id="debug-mode"
              label="Debug mode (logs raw OCR to console)"
              checked={debugMode}
              onChange={(e) => setDebugMode(e.target.checked)}
              style={{ color: '#888' }}
            />
          </Col>
          <Col className="text-end">
            <Button
              variant="warning"
              size="lg"
              onClick={handleUpload}
              disabled={isProcessing || files.length === 0}
            >
              {isProcessing ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Processing...
                </>
              ) : (
                <>
                  🔍 Parse Screenshots
                </>
              )}
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default ScreenshotUploader;
