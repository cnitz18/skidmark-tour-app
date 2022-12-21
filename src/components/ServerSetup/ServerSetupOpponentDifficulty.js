/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import { useEffect, useState } from "react";
import { Container, Row, Col, Form } from "react-bootstrap";
import RangeSlider from "react-bootstrap-range-slider";

export default function ServerSetupOpponentDifficulty({
  updateState,
  state,
  attr,
  difficultyError,
}) {
  // eslint-disable-next-line no-unused-vars
  const [diff, setDiff] = useState(70);

  function updateStateFromInput(val) {
    // console.log('setting ')
    let updatedVal = val;
    //console.log('setting state:',updatedVal)
    updateState(attr.name, updatedVal);
  }
  function updateInputFromState() {
    let val = state[attr.name];
    //console.log('setting inpt:',70 + Math.round(val/2))
    setDiff(val);
  }
  useEffect(() => {
    updateInputFromState();
  }, [state]);
  return (
    <Container>
      <Row>
        <Col lg="3">
          <Form.Control value={state[attr.name]} />
        </Col>
        <Col>
          <RangeSlider
            value={state[attr.name]}
            min={0}
            max={120}
            onChange={(e) => updateStateFromInput(e.target.value)}
            style={difficultyError ? { border: "1px solid red" } : {}}
          />
        </Col>
      </Row>
    </Container>
  );
}
