import React from 'react';
import { useState, useEffect } from 'react';
import { Form, Modal, Button, Row, Col, Table } from 'react-bootstrap';
import { BsFillFileEarmarkPlusFill } from "react-icons/bs";
import ServerSetupField from '../ServerSetup/ServerSetupField';

export default function WeeklyPollModal({ showModal, handleCloseModal, lists }) {
    const [curRaces,setCurRaces] = useState([]);
    const [curID,setCurID] = useState(0);
    
    function createPoll(){
        console.log('creating poll.....', curRaces)
        handleCloseModal();
    }
    function addOption(){
        let newRaces = [ ...curRaces];
        newRaces.push({
            id : curID,
            track : -559709709,
            car : -1338470134,
            notes : ''
        });
        setCurID( curID + 1 );
        setCurRaces([ ...newRaces ])
    }
    function updateRace(index, field, value){
        let newRaces = [ ...curRaces ];
        newRaces[index][field] = value;
        setCurRaces([ ...newRaces ]);
    }
    useEffect(() => {
        console.log('lists:',lists)
    },[showModal])
  return (
    <Modal 
        show={showModal} 
        onHide={handleCloseModal}
        size="lg"
        centered>
        <Modal.Header closeButton>
            <Modal.Title>Create Weekly Poll</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <Form>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Track</th>
                            <th>Car</th>
                            <th>Additional Notes:</th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            curRaces.map((r,i) => (
                                <tr>
                                    <td style={{ textAlign:'center', top:'50%' }}>{r.id}</td>
                                    <td>
                                        <Form.Select 
                                            onChange={(e) => updateRace(i,'track',e.target.value)}
                                            aria-label="Tracks">
                                            {
                                                lists?.tracks?.list?.map((track) => (
                                                    <option value={track.id} key={track.id}>{track.name}</option>
                                                ))
                                            }
                                        </Form.Select>
                                    </td>
                                    <td>
                                        <Form.Select 
                                            onChange={(e) => updateRace(i,'vehicle',e.target.value)}
                                            aria-label="Cars">
                                            {
                                                lists?.vehicle_classes?.list?.map((car) => (
                                                    <option value={car.value} key={car.id}>{car.name}</option>
                                                ))
                                            }
                                        </Form.Select>
                                    </td>
                                    <td>
                                        <Form.Control
                                            onChange={(e) => updateRace(i,'notes',e.target.value)}
                                            as="textarea"/>
                                    </td>
                                </tr>
                            ))
                        }
                    </tbody>
                </Table>
                <div style={{textAlign:'center'}}>
                    <Button variant='outline-primary' onClick={addOption}>
                        <BsFillFileEarmarkPlusFill/> Add Race Option
                    </Button>
                </div>
            </Form>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
                Close
            </Button>
            <Button variant="primary" onClick={createPoll}>
                Create
            </Button>
        </Modal.Footer>
    </Modal>
  );
}
