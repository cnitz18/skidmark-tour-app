import React from "react";
import { Modal, Button, Row, Col, Table } from "react-bootstrap";
import { BsEye } from "react-icons/bs";

export default function ServerSetupLoadPresetModal({
  showLoad,
  handleCloseLoad,
  PresetList,
  handleDeletePreset,
  handleLoadPreset,
  handleViewPreset
}) {
  return (
    <Modal show={showLoad} onHide={handleCloseLoad} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Load Race Preset</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table striped bordered>
          <tbody>
            {PresetList.map((preset, i) => (
              // <Accordion.Item eventKey={i}>
              //   <Accordion.Header>
              <tr>
                <Row key={i} style={{ width: "100%" }}>
                  <Col>
                    {preset.PresetName ? preset.PresetName : "<unnamed>"}
                  </Col>
                  <Col xs lg="1" style={{ marginRight: "10px" }}>
                    <Button onClick={(e) => handleLoadPreset(preset, e)}>
                      Load
                    </Button>
                  </Col>
                  <Col xs lg="1" style={{ marginRight: "15px" }}>
                    <Button
                      variant="danger"
                      onClick={(e) => handleDeletePreset(preset._id, e)}
                    >
                      Delete
                    </Button>
                  </Col>
                  <Col xs lg="1">
                    <Button 
                      variant="link"
                      onClick={(e) => handleViewPreset(preset, e)}
                    >
                        <BsEye />
                    </Button>
                  </Col>
                </Row>
              </tr>
              //   </Accordion.Header>
              // </Accordion.Item>
            ))}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCloseLoad}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
