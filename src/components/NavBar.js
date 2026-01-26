/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react'
import { useState, useEffect } from "react";
import { Route, Routes, BrowserRouter as Router, Navigate, useLocation } from 'react-router-dom'
import { Navbar, Container, Nav } from 'react-bootstrap';
import Home from './Home/Home'
import SessionHistory from './SessionHistory/SessionHistory'
import Leagues from './Leagues/Leagues'
import LeagueDescription from './Leagues/LeagueDescription';
import logo from "../assets/Skidmark_Logo_Title.png";
import styles from './NavBar.module.css';
import TrophyRoomBasic from './TrophyRoom/TrophyRoomBasic';
import ServerStatus from './ServerStatus/ServerStatus';
import AdminPortal from './AdminPortal';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Race History', href: '/history' },
  { name: 'Leagues', href: '/leagues'},
  { name: 'Trophy Room', href: '/trophyroom'},
  { name: 'Server', href: '/server' },
]

function TitleUpdater() {
  const location = useLocation();

  useEffect(() => {
    const titleMap = {
      '/': 'The Skidmark Tour',
      '/history': 'Race History | The Skidmark Tour',
      '/leagues': 'Leagues | The Skidmark Tour',
      '/trophyroom': 'Trophy Room | The Skidmark Tour',
      '/server': 'Server Status | The Skidmark Tour',
      '/admin': 'Admin Portal | The Skidmark Tour',
      '/leagueadmin': 'League Admin | The Skidmark Tour',
    };

    // Check if it's a league detail page
    if (location.pathname.startsWith('/league/')) {
      document.title = 'League Details | The Skidmark Tour';
    } else {
      document.title = titleMap[location.pathname] || 'The Skidmark Tour';
    }
  }, [location]);

  return null;
}


export default function NavBar({ enums, lists }) {
  const [selectedRoute, setSelectedRoute] = useState(window.location.pathname);

  function onSelectRoute(e) {
    setSelectedRoute(e.currentTarget.getAttribute('href'));
  }

  return (
    <Router>
      <div className={styles.mainContent}>
        <Navbar 
          expand="lg" 
          className={styles.navbar}
          fixed="top"
        >
          <Container>
            <Navbar.Brand href="/" className={styles.brand}>
              <img 
                src={logo} 
                alt="Logo" 
                className={styles.logo}
              />
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className={styles.navLinks}>
                {
                  navLinks.map((nLink,i) => (
                    <Nav.Link 
                      key={i}
                      value={nLink.href}
                      href={nLink.href} 
                      active={selectedRoute === nLink.href}
                      onClick={onSelectRoute}
                      className={`nav-link ${selectedRoute === nLink.href ? styles.active : ''}`}>
                        {nLink.name}
                      </Nav.Link>
                  ))
                }
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>
        <TitleUpdater />
        <Routes>
          {/* Specific hardcoded redirect from /leagues/winter25 to /league/29 */}
          <Route path="/league/winter25" element={<Navigate to="/league/29" replace />} />
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<SessionHistory enums={enums} lists={lists}/>} />
          <Route path="/leagues" element={<Leagues enums={enums} lists={lists}/>}/>
          <Route path="/leagueadmin" element={<Leagues enums={enums} lists={lists} showAdmin={true}/>}/>
          <Route path="/trophyroom" element={<TrophyRoomBasic/>}/>
          <Route path="/server" element={<ServerStatus enums={enums} lists={lists}/>} />
          <Route path="/admin" element={<AdminPortal enums={enums} lists={lists}/>} />
          <Route
            exact
            path="/league/:id"
            element={<LeagueDescription  enums={enums} lists={lists}/>}
          />
        </Routes>
      </div>
    </Router>
  )
}
