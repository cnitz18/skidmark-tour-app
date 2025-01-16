/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect } from 'react'
import { useState } from "react";
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom'
import { Navbar, Container, Col, Nav } from 'react-bootstrap';
import Home from './Home/Home'
import SessionHistory from './SessionHistory/SessionHistory'
import Leagues from './Leagues/Leagues'
import LeagueDescription from './Leagues/LeagueDescription';
import logo from "../assets/skidmark-placeholder.png";
import styles from './NavBar.module.css';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Race History', href: '/history' },
  { name: 'Leagues', href: '/leagues'},
]


export default function NavBar({ enums, lists }) {
  const [selectedRoute,setSelectedRoute] = useState(null)

  function onSelectRoute(e){
    // console.log('setting selectedRoute:',setSelectedRoute)
    setSelectedRoute(e.currentTarget.value)
  }
  useEffect(() => {
    let href = window.location.href;
    href = href.substring(href.lastIndexOf('/'))
    setSelectedRoute(href)
  },[]);
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
              Skidmark Tour
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
                      className="nav-link">
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
