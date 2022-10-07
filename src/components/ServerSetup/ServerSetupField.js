import { Form } from "react-bootstrap";
import { Image } from "react-bootstrap";
import { Tooltip } from "react-bootstrap";
import { OverlayTrigger } from "react-bootstrap";
import ServerSetupFlags from "./ServerSetupFlags";
import { Button } from "react-bootstrap";
import { useEffect } from "react";

const ServerSetupField = ({ attr, state, enums, list, updateState }) => {
  const tooltip = (desc) => (
    <Tooltip id="Tooltip">
      <span>{desc}</span>
    </Tooltip>
  );

  return (
    <div>
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
                  {e.name}
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
            {list.list && list.list.length ? (
              list.list
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((l) => (
                  <option
                    value={l.id ?? l.value}
                    id={l.value}
                    key={l.id ?? l.value}
                  >
                    {l.name}
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
            <input
              type="number"
              value={state[attr.name]}
              onChange={(e) => updateState(attr.name, e.target.value)}
            ></input>
            <a
              href="https://docs.google.com/spreadsheets/d/1dSst7oaWrwbzhZCRZnfBlfdM-ob2htHyvS4i0g3M-Qw/edit#gid=0"
              target="_blank"
            >
              Flags Calculator
            </a>
            <ServerSetupFlags
              flags={list}
              flagsVal={state[attr.name]}
              updateState={updateState}
            />
          </div>
        ) : (
          <></>
        )}
      </label>
    </div>
  );
};
export default ServerSetupField;
