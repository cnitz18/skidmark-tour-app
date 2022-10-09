import React from "react";
import { useState } from 'react';
import { Form, Button } from "react-bootstrap";
import { BsFillFileEarmarkPlusFill } from "react-icons/bs";
import WeeklyPollModal from "./WeeklyPollModal";

export default function WeeklyPolls({ lists }) {
  const [showModal, setShowModal] = useState(false);

  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => {
    console.log('handleShowmodal')
    setShowModal(true);
  }
  return (
    <div style={{ textAlign: "center" }}>
      <Button variant='outline-primary' onClick={handleShowModal}>
            <BsFillFileEarmarkPlusFill/> Add Poll
      </Button>
      <WeeklyPollModal 
        showModal={showModal}
        lists={lists}
        handleCloseModal={handleCloseModal}/>
    </div> 
  );
}
