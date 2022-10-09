import React from "react";
import { useState, useEffect } from "react";
import { Card, Table, Button, Modal } from "react-bootstrap";
import { BsXCircle } from "react-icons/bs";
import { FiRefreshCcw } from "react-icons/fi";
import postAPIData from "../../utils/postAPIData";

export default function ServerCurrentPlayerList({
  players,
  refreshPlayerList,
}) {
  const [disableButtons, setDisableButtons] = useState(false);
  const [currentToKick, setCurrentToKick] = useState({});
  async function kickCurrentToKick() {
    if (!currentToKick || Object.keys(currentToKick).length == 0) return;
    setDisableButtons(true);
    let res = await postAPIData(
      "/api/session/kick",
      { refid: currentToKick.refid },
      true
    );
    await refreshPlayerList();
    setDisableButtons(false);
    setShow(false);
  }
  async function refreshLocalList() {
    //console.log('refreshLocalList();')
    refreshPlayerList();
  }

  //modal definitions
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const showKickPlayer = async (refid) => {
    //console.log('showKick:',refid)
    setCurrentToKick(refid);
    setShow(true);
  };
  return (
    <>
      <Card>
        <Card.Header as="h4">
          Current Player List:
          <Button style={{ float: "right" }} onClick={refreshLocalList}>
            <FiRefreshCcw />
          </Button>
        </Card.Header>
        <Card.Body>
          <br />
          {players?.length ? (
            <Table striped bordered hover>
              <tbody>
                {players.map((p) => (
                  <tr>
                    <td>{p.name}</td>
                    <td style={{ textAlign: "center" }}>
                      <Button
                        variant="outline-danger"
                        onClick={(e) => showKickPlayer(p)}
                        disabled={disableButtons}
                      >
                        <BsXCircle style={{ marginRight: 10 }} />
                        Kick
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <span>No players found</span>
          )}
        </Card.Body>
      </Card>

      {/* modal definitions */}

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Kick Player</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you would like to kick player{" "}
          <b>{currentToKick?.name}</b>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="danger" onClick={kickCurrentToKick}>
            Kick
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
