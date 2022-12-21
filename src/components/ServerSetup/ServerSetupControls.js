import React from "react";
import { Button, OverlayTrigger, Container, Row, Spinner, Tooltip } from "react-bootstrap";

export default function ServerSetupControls({
  sendServerSetup,
  handleShowSave,
  handleShowLoad,
  advanceSession,
  showSpinner,
}) {
  return (
    <Container>
      {showSpinner ? <Spinner animation="border" role="status"/> : <></>}
      <Row style={{ padding: 2 }}>
      <OverlayTrigger
          key="top"
          placement="top"
          overlay={
            <Tooltip id={`tooltip-top`}>
              Set the server to the settings currently displayed on this page
            </Tooltip>
          }
        >
          <Button variant="success" onClick={sendServerSetup}>
            Send Settings To Server
          </Button>
        </OverlayTrigger>
      </Row>
      <Row style={{ padding: 2 }}>
      <OverlayTrigger
          key="top"
          placement="top"
          overlay={
            <Tooltip id={`tooltip-top`}>
              Save the settings currently displayed on this page as a "Preset" for easy access later
            </Tooltip>
          }
        >
          <Button variant="outline-success" onClick={handleShowSave} disabled>
            Save Settings As Preset
          </Button>
        </OverlayTrigger>
      </Row>
      <Row style={{ padding: 2 }}>
        <OverlayTrigger
            key="bottom"
            placement="bottom"
            overlay={
              <Tooltip id={`tooltip-bottom`}>
                Load an existing race "Preset" for easy access
              </Tooltip>
            }
          >
          <Button variant="outline-primary" onClick={handleShowLoad} disabled>
            Load Existing Preset
          </Button>
        </OverlayTrigger>
      </Row>
      <Row style={{ padding: 2 }}>
        <OverlayTrigger
            key="bottom"
            placement="bottom"
            overlay={
              <Tooltip id={`tooltip-bottom`}>
                Advances the current session. If in Practice, will advance to Quali. If in Quali, will advance to the Race. If in the Race, this button resets the Race to the beginning.
              </Tooltip>
            }
          >
          <Button variant="danger" onClick={advanceSession}>
            Advance Session
          </Button>
        </OverlayTrigger>
      </Row>
    </Container>
  );
}
