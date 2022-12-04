/* eslint-disable react/jsx-no-target-blank */
import {
  Image,
  Form,
  Tooltip,
  OverlayTrigger,
  Container,
  Col,
  Row,
} from "react-bootstrap";
import ServerSetupFlags from "./ServerSetupFlags";
import ServerSetupOpponentDifficulty from "./ServerSetupOpponentDifficulty";
import RangeSlider from "react-bootstrap-range-slider";

const ServerSetupField = ({
  attr,
  state,
  enums,
  list,
  updateState,
  difficultyError,
}) => {
  const tooltip = (desc) => (
    <Tooltip id="Tooltip">
      <span>{desc}</span>
    </Tooltip>
  );

  return (
    <Container>
      <label>
        <div>
          <span style={{ position: "relative", right: "10px" }}>
            {attr.readableName}
          </span>
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
        </div>
        {attr.inputType === "number" ? (
          <input
            type="number"
            value={state[attr.name]}
            onChange={(e) => updateState(attr.name, e.target.value)}
          ></input>
        ) : attr.inputType === "enum" ? (
          <select
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
          </select>
        ) : attr.inputType === "list" ? (
          <select
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
          </select>
        ) : attr.inputType === "boolean" ? ( //console.log(attr,state[attr.name]) : <></>
          <Form.Check
            type="switch"
            id={attr.name}
            checked={state[attr.name] === 1}
            onChange={(e) => {
              updateState(attr.name, e.target.checked ? 1 : 0);
            }}
          />
        ) : attr.inputType === "flags" ? (
          <div>
            <a
              href="https://docs.google.com/spreadsheets/d/1aSgY5wPyvR1eJ-99a26M0RGbaDZqHpYwCiNdxDHa5fA/edit#gid=0"
              target="_blank"
            >
              Calculator
            </a>
            <br />
            <input
              type="number"
              value={state[attr.name]}
              onChange={(e) => updateState(attr.name, e.target.value)}
            ></input>
            <ServerSetupFlags
              flags={list}
              flagsState={state[attr.name]}
              updateState={updateState}
              attr={attr}
            />
          </div>
        ) : attr.inputType === "opponentdifficulty" ? (
          <ServerSetupOpponentDifficulty
            updateState={updateState}
            state={state}
            attr={attr}
            difficultyError={difficultyError}
          />
        ) : attr.inputType === "slider" ? (
          <Container>
            <Row>
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
            </Row>
          </Container>
        ) : (
          <></>
        )}
      </label>
    </Container>
  );
};
export default ServerSetupField;
