import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import styles from './LiveStreams.module.css';

export default function LiveStreams({ streams }) {
    if (!streams.length) return null;
    
    return (
        <div className={styles.liveStreamsSection}>
            <h2>Live Now</h2>
            <Row>
                {streams.map(stream => (
                    <Col key={stream.id} md={6} lg={4}>
                        <Card className={styles.streamCard}>
                            <div className={styles.embedWrapper}>
                                <iframe
                                    src={`https://player.twitch.tv/?channel=${stream.user_name}&parent=${window.location.hostname}&mute=true`}
                                    frameBorder="0"
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
        </div>
    );
}