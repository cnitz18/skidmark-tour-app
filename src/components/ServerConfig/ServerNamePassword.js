/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import { useState, useEffect } from "react";
import { Card, Button, Form, Modal } from "react-bootstrap";
import DedicatedServerCommands from "../../utils/Classes/DedicatedServerCommands";

export default function ServerNamePassword({ config }) {
  const [curPassword, setCurPassword] = useState("");
  const [curServerName, setCurServerName] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);

  function updateCurConfig() {
    setCurPassword(config?.pwd);
    setCurServerName(config?.name);
  }

  async function restartAndClose() {
    await DedicatedServerCommands.updateSessionConfig({
      name: curServerName,
      pwd: curPassword,
    });
    await DedicatedServerCommands.softRestartServer();
    handleCloseModal();
  }
  useEffect(() => {
    updateCurConfig();
  }, [config]);
  return (
    <>
      <Card>
        <Card.Header as="h4">
          Server Configuration (Requires Game Server Restart):
        </Card.Header>
        <Card.Body>
          <Form>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Server Name:</Form.Label>
              <Form.Control
                value={curServerName}
                onChange={(e) => setCurServerName(e.target.value)}
              />
              <Form.Text className="text-muted">
                Special characters will be removed
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>
                Server Password (leave empty for public lobby):
              </Form.Label>
              <input
                className="form-control"
                onChange={(e) => setCurPassword(e.target.value)}
                value={curPassword}
              />
            </Form.Group>
            <Button variant="primary" onClick={handleShowModal}>
              Submit
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Restart Server</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          In order to save the configuration changes you just made, a game
          server restart will be required, and all players will be kicked from
          the server. Would you like to proceed?
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
