/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react'
import { useState } from "react";
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom'
import { Navbar, Container, Nav } from 'react-bootstrap';
import Home from './Home/Home'
import SessionHistory from './SessionHistory/SessionHistory'
import Leagues from './Leagues/Leagues'
import LeagueDescription from './Leagues/LeagueDescription';
import logo from "../assets/skidmark-placeholder.png";
import styles from './NavBar.module.css';
import TrophyRoomBasic from './TrophyRoom/TrophyRoomBasic';
import ServerStatus from './ServerStatus/ServerStatus';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Race History', href: '/history' },
  { name: 'Leagues', href: '/leagues'},
  { name: 'Trophy Room', href: '/trophyroom'},
  { name: 'Server', href: '/server' },
]


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
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<SessionHistory enums={enums} lists={lists}/>} />
          <Route path="/leagues" element={<Leagues enums={enums} lists={lists}/>}/>
          <Route path="/leagueadmin" element={<Leagues enums={enums} lists={lists} showAdmin={true}/>}/>
          <Route path="/trophyroom" element={<TrophyRoomBasic/>}/>
          <Route path="/server" element={<ServerStatus/>} />
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
