import React from "react";
import { useState } from "react";
import { Card, Button, Modal } from "react-bootstrap";
import DedicatedServerCommands from "../../utils/Classes/DedicatedServerCommands";

export default function ServerTroubleshooting() {
  const [showModal, setShowModal] = useState(false);

  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);

  async function restartAndClose() {
    await DedicatedServerCommands.softRestartServer();
    handleCloseModal();
  }
  return (
    <>
      <Card>
        <Card.Header as="h4">Troubleshooting:</Card.Header>
        <Card.Body>
          <Button onClick={handleShowModal}>Soft Restart Game Server</Button>
        </Card.Body>
      </Card>
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Restart Server</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          You are about to restart the game server, and all players will be
          kicked. Would you like to proceed?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Button variant="warning" onClick={restartAndClose}>
            Restart
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
