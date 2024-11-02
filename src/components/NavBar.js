/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect } from 'react'
import { useState } from "react";
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom'
import { Nav, Navbar, Container, Col } from 'react-bootstrap'
import Home from './Home/Home'
import SessionHistory from './SessionHistory/SessionHistory'
import Leagues from './Leagues/Leagues'
import LeagueDescription from './Leagues/LeagueDescription';

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
      <Navbar bg="dark" variant="dark" expand="lg">
          <Container>
            <Col>
              <Navbar.Brand href="/">{process.env.REACT_APP_ENV}</Navbar.Brand>
            </Col>
            <Col></Col>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Col sm>
              <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto">
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
                  {/* <Nav.Link href="/" active>Home</Nav.Link>
                  <Nav.Link href="/history" active>Race History</Nav.Link>
                  <Nav.Link href="/leagues">Leagues</Nav.Link> */}
                </Nav>
              </Navbar.Collapse>
            </Col>
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
    </Router>
  )
}
