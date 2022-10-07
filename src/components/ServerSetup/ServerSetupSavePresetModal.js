import React from "react";
import { Modal, Button } from "react-bootstrap";

export default function ServerSetupSavePresetModal({
  showSave,
  handleCloseSave,
  saveServerSetup,
  PresetName,
  setPresetName,
}) {
  return (
    <Modal show={showSave} onHide={handleCloseSave} centered>
      <Modal.Header closeButton>
        <Modal.Title>Saving Race Preset</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <label>
          Enter Name for Preset:
          <input
            type="text"
            onInput={(e) => setPresetName(e.target.value)}
            value={PresetName}
          ></input>
        </label>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCloseSave}>
          Close
        </Button>
        <Button variant="primary" onClick={saveServerSetup}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
