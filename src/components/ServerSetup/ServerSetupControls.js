import React from "react";
import { Button, ButtonGroup, Col, Row, Spinner } from "react-bootstrap";

export default function ServerSetupControls({
  sendServerSetup,
  handleShowSave,
  handleShowLoad,
  advanceSession,
  showSpinner,
}) {
  return (
    <Row>
      <Col sm={1}>
        {showSpinner ? <Spinner animation="border" role="status" /> : <></>}
      </Col>
      <Col>
        <ButtonGroup aria-label="Basic example">
          <Button variant="success" onClick={sendServerSetup}>
            Send Settings To Server
          </Button>
          <Button variant="outline-success" onClick={handleShowSave}>
            Save Settings As Preset
          </Button>
          <Button variant="outline-primary" onClick={handleShowLoad}>
            Load Existing Preset
          </Button>
          <Button variant="danger" onClick={advanceSession}>
            Advance Session
          </Button>
        </ButtonGroup>
      </Col>
    </Row>
  );
}
