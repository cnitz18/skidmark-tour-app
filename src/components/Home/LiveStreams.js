import React from 'react';
import { Card, Row, Col, Alert } from 'react-bootstrap';
import { BsTwitch } from 'react-icons/bs';
import styles from './LiveStreams.module.css';

export default function LiveStreams({ streams }) {
    return (
        <div className={styles.liveStreamsSection}>
            <h2 className="text-center mb-4">Live Now</h2>
            {streams.length ? (
                <Row className="justify-content-center g-4">
                    {streams.map(stream => (
                        <Col key={stream.id} md={6} lg={4} className="d-flex justify-content-center">
                            <Card className={styles.streamCard}>
                                <div className={styles.embedWrapper}>
                                    <iframe
                                        src={`https://player.twitch.tv/?channel=${stream.user_name}&parent=${window.location.hostname}&mute=true`}
                                        allowFullScreen
                                        title={stream.user_name}
                                    />
                                </div>
                                <Card.Body>
                                    <Card.Title>{stream.user_name}</Card.Title>
                                    <Card.Text>{stream.title}</Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : (
                <Alert variant="info" className="text-center">
                    <BsTwitch className="me-2" />
                    No streamers are currently live. Check back later!
                </Alert>
            )}
        </div>
    );
}