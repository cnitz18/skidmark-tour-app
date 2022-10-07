import { Modal, Button } from "react-bootstrap";
import { useState } from "react";

const ServerSetupWarning = ({ show }) => {
  const [showYourself, setShowYourself] = useState(show);
  const handleClose = () => setShowYourself(false);
  return (
    <Modal
      show={showYourself}
      onHide={handleClose}
      backdrop="static"
      keyboard={false}
      style={{ textAlign: "center" }}
    >
      <Modal.Header>
        <Modal.Title>Dedicated Server Setup</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Hello and welcome to the Skidmark Tour Dedicated Server setup page.
        </p>
        <p>
          <b>** Please do not be a malicious user!! **</b>
        </p>
        <p>
          This site is under active development, and has not yet been
          idiot-proofed
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleClose}>
          Understood
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
export default ServerSetupWarning;
