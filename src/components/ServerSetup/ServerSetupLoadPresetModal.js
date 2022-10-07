import React from 'react';
import { Modal, Button } from 'react-bootstrap';

export default function ServerSetupLoadPresetModal({ showLoad, handleCloseLoad, PresetList, handleDeletePreset, handleLoadPreset }) {
  return (
    <Modal show={showLoad} onHide={handleCloseLoad} centered>
    <Modal.Header closeButton>
      <Modal.Title>Load Race Preset</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {PresetList.map((preset, i) => (
        // <Accordion.Item eventKey={i}>
        //   <Accordion.Header>
            <label key={i}>
              {preset.PresetName ? preset.PresetName : "<unnamed>"}
              <Button
                style={{ float: "right" }}
                variant='danger'
                onClick={(e) => handleDeletePreset(preset._id, e)}
              >
                Delete
              </Button>
              <Button
                style={{ float: "right" }}
                onClick={(e) => handleLoadPreset(preset, e)}
              >
                Load
              </Button>

            </label>
        //   </Accordion.Header>
        // </Accordion.Item>
      ))}
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={handleCloseLoad}>
        Close
      </Button>
    </Modal.Footer>
  </Modal>
  );
}
