import React from "react";
import { Accordion, Button } from "react-bootstrap";
import { FiTrash2 } from "react-icons/fi";
import WeeklyPollEntryDetails from "./WeeklyPollEntryDetails";
import postAPIData from "../../utils/postAPIData";

export default function WeeklyPollEntry({
  poll,
  incrementPolls,
  refreshSavedPolls,
  lists,
  navigateToTab,
}) {
  async function deletePoll() {
    await fetch(process.env.REACT_APP_AMS2API + "/db/polls/" + poll._id, { method: "DELETE" });
    return refreshSavedPolls();
  }
  async function completePoll() {
    let updatedPoll = { ...poll };
    updatedPoll.complete = true;
    await postAPIData("/db/polls/update/" + updatedPoll._id, updatedPoll);
    refreshSavedPolls();
  }

  return (
    <Accordion>
      <Accordion.Item eventKey="">
        <span style={{ float: "right" }}>
          <Button variant="outline-danger" onClick={deletePoll}>
            <FiTrash2 color="red" />
          </Button>
        </span>
        <span>
          <h4 style={{ margin: "5px" }}>{poll.name}</h4>
        </span>
        <small>
          Submitted by: {poll.createdBy} on {poll.createdOn}
        </small>
        <Accordion.Header>Details:</Accordion.Header>
        <Accordion.Body>
          <WeeklyPollEntryDetails
            poll={poll}
            lists={lists}
            incrementPolls={incrementPolls}
            handleCompletePoll={completePoll}
            navigateToTab={navigateToTab}
          />
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}
