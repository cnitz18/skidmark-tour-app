import React, { useState, useEffect } from "react";
import { Table, FormCheck, Button, Modal } from "react-bootstrap";
import { MdSaveAlt } from "react-icons/md";
import WeeklyPollDefaultSetup from "./WeeklyPollDefaultSetup";
import DedicatedServerCommands from "../../utils/Classes/DedicatedServerCommands";
import getAPIData from "../../utils/getAPIData";
export default function WeeklyPollEntryDetails({
  poll,
  lists,
  incrementPolls,
  handleCompletePoll,
  navigateToTab,
}) {
  const [checkedState, setCheckedState] = useState({});
  const [selectedRace, setSelectedRace] = useState({});
  const [show, setShow] = useState(false);
  const [showLoad, setShowLoad] = useState(false);

  const completeAndClose = async () => {
    handleCompletePoll();
    setShow(false);
  };
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  const handleCloseLoad = () => setShowLoad(false);
  const handleLoad = async () => {
    // console.log("handleLoad", selectedRace);
    if (selectedRace) {
      let setup = {};
      for (let field in WeeklyPollDefaultSetup) {
        if (field === "VehicleClassId")
          setup["session_" + field] = selectedRace.car;
        else if (field === "TrackId")
          setup["session_" + field] = selectedRace.track;
        else if (field !== "_id")
          setup["session_" + field] = WeeklyPollDefaultSetup[field];
      }
      // console.log('setupss:',setup);
      let attrList = await getAPIData("/api/list/attributes/session");
      // console.log('list?',attrList?.list?.length)
      await DedicatedServerCommands.setDedicatedServerState(
        setup,
        attrList?.list
          ?.filter((e) => e.access === "ReadWrite")
          .map((e) => e.name)
      );
      // console.log('weekly poll res:',res);
      setSelectedRace({});
      handleCloseLoad();
      // console.log('nav:',navigateToTab)
      navigateToTab("serverSetup");
    }
  };
  const handleShowLoad = (raceID) => {
    let selRace = poll?.races?.find((r) => r.id === raceID);
    if (selRace) {
      setSelectedRace({ ...selRace });
      // console.log("selRace", selRace);

      setShowLoad(true);
    }
  };
  function updateVoteState(id, checked) {
    // console.log("updateVoteState", id, checked);
    let newCheckedState = { ...checkedState };
    newCheckedState[id] = checked;
    setCheckedState({ ...newCheckedState });
  }
  function saveVote() {
    incrementPolls({ ...checkedState }, poll._id);
    clearCheckedState();
  }
  function clearCheckedState() {
    let newCheckedState = {};
    // console.log("clearingcheckstate:", poll);
    //( let id in poll )
    poll?.races?.forEach((r) => {
      newCheckedState[r.id] = false;
    });
    setCheckedState({ ...newCheckedState });
  }
  useEffect(() => {
    // console.log("poll:", poll, lists);
    clearCheckedState();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lists, poll]);
  return (
    <div>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>{!poll.complete ? <span>Vote</span> : <span>Load</span>}</th>
            <th>Track</th>
            <th>Car</th>
            <th>Additional Notes:</th>
            <th>Total Votes:</th>
          </tr>
        </thead>
        <tbody>
          {poll?.races.map((r, i) => (
            <tr key={i}>
              <td>
                {!poll.complete ? (
                  <FormCheck
                    checked={checkedState[r.id]}
                    onChange={(e) => updateVoteState(r.id, e.target.checked)}
                  />
                ) : (
                  <Button variant="light" onClick={() => handleShowLoad(r.id)}>
                    <MdSaveAlt color="blue" />
                  </Button>
                )}
              </td>
              <td>{lists?.tracks?.list?.find((t) => t.id === r.track)?.name}</td>
              <td>
                {
                  lists?.vehicle_classes?.list?.find((c) => c.value === r.car)
                    ?.name
                }
              </td>
              <td>{r.notes}</td>
              <td>{r.votes}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div style={{ textAlign: "center" }} variant="primary-outline">
        {!poll.complete ? (
          <>
            <Button onClick={saveVote}>Vote</Button>
            <Button
              variant="outline-success"
              style={{ margin: 2 }}
              onClick={handleShow}
            >
              Complete Poll
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline-secondary" disabled>
              Poll Completed
            </Button>
          </>
        )}
      </div>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Complete Poll</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Would you like to complete the poll "{poll.name}"? This will lock
          voting, but allow you to load races into the server setup as presets.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="success" onClick={completeAndClose}>
            Complete
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showLoad} onHide={handleCloseLoad}>
        <Modal.Header closeButton>
          <Modal.Title>Load Race</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Would you like load this race from poll "{poll.name}"? This will
          redirect you to the Race Settings page
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseLoad}>
            Close
          </Button>
          <Button variant="success" onClick={handleLoad}>
            Complete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
