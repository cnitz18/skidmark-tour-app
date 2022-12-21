/* eslint-disable react/jsx-no-target-blank */
import {
  Form,
  Container,
  Col,
  FloatingLabel
} from "react-bootstrap";
import ServerSetupOpponentDifficulty from "./ServerSetupOpponentDifficulty";
import RangeSlider from "react-bootstrap-range-slider";

const ServerSetupField = ({
  attr,
  state,
  enums,
  list,
  updateState,
  difficultyError,
  mainForm
}) => {

  return (
    <Form.Group className={ mainForm ? 'main-form-element': ""}>
      {
        attr.inputType === "boolean" ? 
        (
          <Form.Label>
            <Form.Check
              id={attr.name}
              checked={state[attr.name] === 1}
              onChange={(e) => {
                updateState(attr.name, e.target.checked ? 1 : 0);
              }}
              inline          
              />
              {attr.readableName}
          </Form.Label>
        )
        :
        attr.inputType === "opponentdifficulty" ? 
        (
          <Form.Label>
            {attr.readableName}
            <ServerSetupOpponentDifficulty
              updateState={updateState}
              state={state}
              attr={attr}
              difficultyError={difficultyError}
              />
          </Form.Label>
        )
        :
        (
          <FloatingLabel
          label={attr.readableName}
          className="mb-3"
        >
          {/* <div>
            <OverlayTrigger placement="right" overlay={tooltip(attr.description)}>
              <Image src="info-icon.png" width="15px" />
            </OverlayTrigger>
            {attr.name === "GridSize" ? (
              <OverlayTrigger
                placement="right"
                overlay={tooltip(
                  "WARNING: this setting is known to lead to server performance issues with increased Grid Size, and has a maximum value of 32.\nThis hasn't been tested too in-depth, but 20 tends to be a safe number, and 32 causes significant performance issues"
                )}
              >
                <Image
                  src="info-icon-red.png"
                  width="15px"
                  style={{ position: "relative", left: "5px" }}
                />
              </OverlayTrigger>
            ) : (
              <></>
            )}
          </div> */}
          {attr.inputType === "number" ? (
            <Form.Control
              type="number"
              value={state[attr.name]}
              onChange={(e) => updateState(attr.name, e.target.value)}
            ></Form.Control>
          ) : attr.inputType === "enum" ? (
            <Form.Select
              value={state[attr.name]}
              onChange={(e) => updateState(attr.name, e.target.value)}
            >
              {enums.length ? (
                enums.map((e) => (
                  <option value={e.value} id={e.id} key={e.value}>
                    {e.name.replaceAll("_", " ")}
                  </option>
                ))
              ) : (
                <></>
              )}
            </Form.Select>
          ) : attr.inputType === "list" ? (
            <Form.Select
              value={state[attr.name]}
              onChange={(e) => updateState(attr.name, e.target.value)}
            >
              {list && list.length ? (
                list
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((l) => (
                    <option
                      value={l.id ?? l.value}
                      id={l.value}
                      key={l.id ?? l.value}
                    >
                      {l.name.replaceAll("_", " ")}
                    </option>
                  ))
              ) : (
                <></>
              )}
              {list.list && list.list.length ? (
                list.list
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((l) => (
                    <option
                      value={l.id ?? l.value}
                      id={l.value}
                      key={l.id ?? l.value}
                    >
                      {l.name.replaceAll("_", " ")}
                    </option>
                  ))
              ) : (
                <></>
              )}
            </Form.Select>
          ) : attr.inputType === "slider" ? (
            <Container>
                <Col xs lg="2">
                  <Form.Control
                    value={state[attr.name]}
                    onChange={(e) => updateState(attr.name, e.target.value)}
                  />
                </Col>
                <Col>
                  <RangeSlider
                    value={state[attr.name]}
                    onChange={(e) => updateState(attr.name, e.target.value)}
                    min={attr.min ?? 0}
                    max={attr.max ?? 99}
                  />
                </Col>
            </Container>
          ) : (
            <></>
          )}
        </FloatingLabel>
        )
      }
     
    </Form.Group>
  );
};
export default ServerSetupField;
