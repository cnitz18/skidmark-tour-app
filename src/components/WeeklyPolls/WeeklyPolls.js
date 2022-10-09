import React from "react";
import { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import { BsFillFileEarmarkPlusFill } from "react-icons/bs";
import { FiRefreshCcw } from "react-icons/fi";
import WeeklyPollModal from "./WeeklyPollModal";
import getAPIData from "../../utils/getAPIData";
import WeeklyPollEntry from "./WeeklyPollEntry";
import postAPIData from "../../utils/postAPIData";

export default function WeeklyPolls({ lists, navigateToTab }) {
  const [savedPolls, setSavedPolls] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const handleCloseModal = () => {
    refreshSavedPolls();
    setShowModal(false);
  };
  const handleShowModal = () => {
    // console.log("handleShowmodal");
    setShowModal(true);
  };
  async function refreshSavedPolls() {
    let res = await getAPIData("/db/polls");
    if (res && res.length) setSavedPolls([...res.reverse()]);
    return res;
    //console.log('from savedPolls:',res);
  }
  async function incrementPolls(states, pollID) {
    let poll = savedPolls.find((p) => p._id === pollID);
    // console.log("savedPolls poll:", poll);
    if (poll) {
      let updatedPoll = { ...poll };
      let updatedRaces = [...updatedPoll.races];
      // console.log("races:", updatedRaces);
      let wasUpdated = false;
      for (let id in states) {
        let raceIndex = updatedRaces.findIndex((r) => r.id == id);
        if (raceIndex !== -1 && states[id]) {
          wasUpdated = true;
          let curRace = { ...updatedRaces[raceIndex] };
          curRace.votes++;
          updatedPoll.races[raceIndex] = curRace;
        }
      }
      if (wasUpdated) {
        let res = await postAPIData(
          "/db/polls/update/" + updatedPoll._id,
          updatedPoll
        );
        // console.log("update poll res:", res);
      }
    }
  }
  useEffect(() => {
    refreshSavedPolls();
  }, [lists]);
  return (
    <div style={{ textAlign: "center" }}>
      <Button variant="outline-primary" onClick={handleShowModal}>
        <BsFillFileEarmarkPlusFill /> Add Poll
      </Button>
      <Button style={{ float: "right" }} onClick={refreshSavedPolls}>
        <FiRefreshCcw />
      </Button>
      {savedPolls?.map((p, i) => (
        <WeeklyPollEntry
          key={i}
          poll={p}
          refreshSavedPolls={refreshSavedPolls}
          incrementPolls={incrementPolls}
          lists={lists}
          navigateToTab={navigateToTab}
        />
      ))}
      <WeeklyPollModal
        showModal={showModal}
        lists={lists}
        handleCloseModal={handleCloseModal}
      />
    </div>
  );
}
