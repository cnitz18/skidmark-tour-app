/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react'
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom'
import { Nav, Navbar, Container } from 'react-bootstrap'
import Home from './Home/Home'
import SessionHistory from './SessionHistory/SessionHistory'
import NewServerSetupPage from './NewServerSetup/NewServerSetupPage'

export default function NavBar({ enums, lists }) {
  return (
    <Router>
      <Navbar bg="dark" variant="dark" expand="lg">
          <Container>
              <Navbar.Brand href="/">Skidmark Tour</Navbar.Brand>
              <Nav className="me-auto">
                <Nav.Link href="/" active>Home</Nav.Link>
                <Nav.Link href="/history" active>History</Nav.Link>
                <Nav.Link href="/serversetup" active>Server Setup</Nav.Link>
              </Nav>
          </Container>
      </Navbar>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/history" element={<SessionHistory enums={enums} lists={lists}/>} />
        <Route path="/serversetup" element={<NewServerSetupPage enums={enums} lists={lists}/> }/>
      </Routes>
    </Router>
  )
}
