import React from "react";
import { useEffect, useState } from "react";
import { Accordion, Button } from "react-bootstrap";
import { FiTrash2 } from "react-icons/fi";
import AMS2API from "../../utils/AMS2API";
import WeeklyPollEntryDetails from "./WeeklyPollEntryDetails";
import postAPIData from "../../utils/postAPIData";

export default function WeeklyPollEntry({
  poll,
  incrementPolls,
  refreshSavedPolls,
  lists,
}) {
  async function deletePoll() {
    console.log("deletePOll:", poll._id);
    await fetch(AMS2API + "/db/polls/" + poll._id, { method: "DELETE" });
    return refreshSavedPolls();
  }
  async function completePoll() {
    console.log("COMPELTE", poll);
    let updatedPoll = { ...poll };
    updatedPoll.complete = true;
    console.log("sending:", updatedPoll);
    let res = await postAPIData(
      "/db/polls/update/" + updatedPoll._id,
      updatedPoll
    );
    console.log("res:", res);
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
        <h4>{poll.name}</h4>
        <span>
          Submitted by: {poll.createdBy} on {poll.createdOn}
        </span>
        <Accordion.Header>Details:</Accordion.Header>
        <Accordion.Body>
          <WeeklyPollEntryDetails
            poll={poll}
            lists={lists}
            incrementPolls={incrementPolls}
            handleCompletePoll={completePoll}
          />
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
}
