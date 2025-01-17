import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { BsGithub, BsLinkedin } from 'react-icons/bs'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <Container>
        <Row className="align-items-center">
          <Col md={6}>
            <p className={styles.copyright}>Casey Nitz &copy; {new Date().getFullYear()}</p>
          </Col>
          <Col md={6}>
            <div className={styles.socialLinks}>
              <a href="https://github.com/cnitz18" target="_blank" rel="noopener noreferrer">
                <BsGithub />
              </a>
              <a href="https://www.linkedin.com/in/caseynitz/" target="_blank" rel="noopener noreferrer">
                <BsLinkedin />
              </a>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  )
}
