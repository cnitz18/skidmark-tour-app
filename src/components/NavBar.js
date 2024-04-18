/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react'
import { useState } from "react";
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom'
import { Nav, Navbar, Container, Col } from 'react-bootstrap'
import Home from './Home/Home'
import SessionHistory from './SessionHistory/SessionHistory'
import NewServerSetupPage from './NewServerSetup/NewServerSetupPage'
import Leagues from './Leagues/Leagues'

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Race History', href: '/history' },
  // { name: 'Leagues', href: '/leagues'}
]


export default function NavBar({ enums, lists }) {
  const [selectedRoute,setSelectedRoute] = useState('/')

  function onSelectRoute(e){
    console.log('setting selectedRoute:',setSelectedRoute)
    setSelectedRoute(e.currentTarget.value)
  }
  return (
    <Router>
      <Navbar bg="dark" variant="dark" expand="lg">
          <Container>
            <Col>
              <Navbar.Brand href="/">Skidmark Tour</Navbar.Brand>
            </Col>
            <Col></Col>
            <Col sm>
              <Nav className="me-auto">
                {
                  navLinks.map((nLink,i) => (
                    <Nav.Link 
                      key={i}
                      value={nLink.href}
                      href={nLink.href} 
                      active={selectedRoute === nLink.href}
                      onClick={onSelectRoute}>
                        {nLink.name}
                      </Nav.Link>
                  ))
                }
                {/* <Nav.Link href="/" active>Home</Nav.Link>
                <Nav.Link href="/history" active>Race History</Nav.Link>
                <Nav.Link href="/leagues">Leagues</Nav.Link> */}
              </Nav>
            </Col>
          </Container>
      </Navbar>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/history" element={<SessionHistory enums={enums} lists={lists}/>} />
        <Route path="/leagues" element={<Leagues enums={enums} lists={lists}/>}/>
        <Route path="/serversetup" element={<NewServerSetupPage enums={enums} lists={lists}/> }/>
      </Routes>
    </Router>
  )
}
