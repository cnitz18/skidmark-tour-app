/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react'
import { Nav, Navbar, Container } from 'react-bootstrap'
export default function NavBar() {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
            <Navbar.Brand href="#home">Skidmark Tour Official Server</Navbar.Brand>
            <Nav>
                    <Nav.Link href="#home" active>Home</Nav.Link>
                    <Nav.Link href="#polls">Weekly Polls</Nav.Link>
            </Nav>
        </Container>
    </Navbar>
  )
}
