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
    let updatedVal = val;
    updateState(attr.name, updatedVal);
  }
  function updateInputFromState() {
    let val = state[attr.name];
    setDiff(val);
  }
  useEffect(() => {
    updateInputFromState();
  }, [state]);
  return (
    <Container>
      <Row>
        <Col lg="3">
          <Form.Control value={state[attr.name]} readOnly/>
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
