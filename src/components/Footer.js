import React from 'react'
import { Container, Row, Col } from 'react-bootstrap'
import { BsGithub, BsLinkedin, BsSunFill, BsMoonFill } from 'react-icons/bs'
import { useTheme } from '../contexts/ThemeContext'
import styles from './Footer.module.css'

export default function Footer() {
  const { theme, toggleTheme } = useTheme()

  return (
    <footer className={styles.footer}>
      <Container>
        <Row className="align-items-center">
          <Col md={4}>
            <p className={styles.copyright}>Casey Nitz &copy; {new Date().getFullYear()}</p>
          </Col>
          <Col md={4} className="d-flex justify-content-center">
            <button 
              className={styles.themeToggle} 
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <BsMoonFill /> : <BsSunFill />}
            </button>
          </Col>
          <Col md={4}>
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
