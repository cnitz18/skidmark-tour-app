import { useMemo, useState } from 'react';
import { Container, Row, Col, Card, Form, Badge } from 'react-bootstrap';
import PageHeader from '../shared/PageHeader';
import styles from './FontLab.module.css';

const FONT_OPTIONS = [
  {
    key: 'tamworth',
    label: 'Tamworth (Current)',
    cssFamily: 'Tamworth, sans-serif',
    note: 'Single-file local font. Limited weight/style control.'
  },
  {
    key: 'exo2',
    label: 'Exo 2',
    cssFamily: '"Exo 2", sans-serif',
    note: 'Variable family with strong legibility at UI sizes.'
  },
  {
    key: 'barlow',
    label: 'Barlow Condensed',
    cssFamily: '"Barlow Condensed", sans-serif',
    note: 'Condensed motorsport feel with full weight and italic range.'
  },
  {
    key: 'chakra',
    label: 'Chakra Petch',
    cssFamily: '"Chakra Petch", sans-serif',
    note: 'Angular tech look, still practical for short UI labels.'
  }
];

const SAMPLE_LINES = [
  'Leagues',
  'Race History | The Skidmark Tour',
  'Comeback Factor: verydystrbd',
  'Average positions gained from qualifying to finish',
  'Nurburgring GP 2020 Sprint Feature'
];

const FontLab = () => {
  const [fontSize, setFontSize] = useState(16);
  const [fontWeight, setFontWeight] = useState(500);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [italic, setItalic] = useState(false);

  const dynamicStyle = useMemo(
    () => ({
      fontSize: `${fontSize}px`,
      fontWeight,
      letterSpacing: `${letterSpacing}px`,
      fontStyle: italic ? 'italic' : 'normal',
      lineHeight: 1.35
    }),
    [fontSize, fontWeight, letterSpacing, italic]
  );

  return (
    <Container className="motion-fade-in">
      <PageHeader
        title="Font Lab"
        subtitle="Compare Tamworth against flexible alternatives at real UI sizes"
      />

      <Card className={`${styles.controlsCard} motion-rise-in`}>
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Label>Size ({fontSize}px)</Form.Label>
              <Form.Range
                min={12}
                max={28}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
              />
            </Col>
            <Col md={3}>
              <Form.Label>Weight ({fontWeight})</Form.Label>
              <Form.Range
                min={300}
                max={800}
                step={50}
                value={fontWeight}
                onChange={(e) => setFontWeight(Number(e.target.value))}
              />
            </Col>
            <Col md={3}>
              <Form.Label>Letter Spacing ({letterSpacing.toFixed(1)}px)</Form.Label>
              <Form.Range
                min={-0.5}
                max={1.5}
                step={0.1}
                value={letterSpacing}
                onChange={(e) => setLetterSpacing(Number(e.target.value))}
              />
            </Col>
            <Col md={3}>
              <Form.Check
                type="switch"
                id="italic-switch"
                label="Italic"
                checked={italic}
                onChange={(e) => setItalic(e.target.checked)}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-3 mt-1 motion-stagger">
        {FONT_OPTIONS.map((font) => (
          <Col lg={6} key={font.key}>
            <Card className={styles.fontCard}>
              <Card.Header className={styles.fontCardHeader}>
                <div>
                  <strong>{font.label}</strong>
                  <div className={styles.subtle}>{font.note}</div>
                </div>
                <Badge bg="secondary">{font.cssFamily}</Badge>
              </Card.Header>
              <Card.Body>
                <div className={styles.sampleBlock} style={{ ...dynamicStyle, fontFamily: font.cssFamily }}>
                  {SAMPLE_LINES.map((line) => (
                    <div key={line} className={styles.sampleLine}>{line}</div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default FontLab;
