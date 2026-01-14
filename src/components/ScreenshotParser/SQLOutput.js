import { useState, useCallback } from "react";
import { Card, Button, Row, Col } from "react-bootstrap";
import styles from "./ScreenshotParser.module.css";

const SQLOutput = ({ sql, onReset, onBack }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = sql;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [sql]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `race_import_${new Date().toISOString().slice(0, 10)}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [sql]);

  return (
    <Card className={styles.reviewCard}>
      <Card.Header>
        <Row className="align-items-center">
          <Col>
            <h5 className="mb-0">📝 Generated SQL Script</h5>
          </Col>
          <Col xs="auto">
            <div className={styles.copyButton}>
              <Button 
                variant="outline-light" 
                size="sm"
                onClick={handleCopy}
                className="me-2"
              >
                📋 Copy
              </Button>
              {copied && <span className={styles.copySuccess}>Copied!</span>}
            </div>
            <Button 
              variant="outline-info" 
              size="sm"
              onClick={handleDownload}
            >
              💾 Download .sql
            </Button>
          </Col>
        </Row>
      </Card.Header>
      <Card.Body>
        <pre className={styles.sqlOutput}>
          {sql}
        </pre>

        <div className="mt-4 p-3" style={{ backgroundColor: '#1a2744', borderRadius: '8px' }}>
          <h6 style={{ color: '#ffc107' }}>📋 Next Steps:</h6>
          <ol style={{ color: '#ccc', marginBottom: 0 }}>
            <li>Copy the SQL script above or download the .sql file</li>
            <li>Open <strong>pgAdmin</strong> and connect to your database</li>
            <li>Open the <strong>Query Tool</strong> (Tools → Query Tool)</li>
            <li>Paste the SQL script and click <strong>Execute (F5)</strong></li>
            <li>Verify the insert by checking the final SELECT statement result</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <Button variant="outline-secondary" onClick={onBack}>
            ← Back to Review
          </Button>
          <Button variant="warning" onClick={onReset}>
            🔄 Parse Another Screenshot
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default SQLOutput;
