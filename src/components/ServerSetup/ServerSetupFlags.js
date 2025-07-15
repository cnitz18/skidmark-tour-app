/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import { Accordion } from "react-bootstrap";

const ServerSetupFlags = ({ flags, flagsState, updateState, attr }) => {
  const [flagStatuses, setFlagStatuses] = useState({});
  const [curFlagState, setCurFlagState] = useState(0);

  function updateCurFlagsFromState() {
    let curValue = flagsState;
    let flagStatus = {};
    let flagInfo = flags.session?.list;
    flagInfo
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .forEach((f) => {
        flagStatus[f.name] = { checked: false, ...f };

        if (
          (curValue - f.value >= 0 && f.name !== "COOLDOWNLAP") ||
          (f.name === "COOLDOWNLAP" && curValue < 0)
        ) {
          curValue -= f.value;
          flagStatus[f.name].checked = true;
        }
      });
    setFlagStatuses({ ...flagStatus });
  }
  function updateStateFromFlagCheck(st, checked) {
    //updateState('Flags',flags - st.value)

    if (checked) {
      updateState(attr.name, flagsState + st.value);
    } else {
      updateState(attr.name, flagsState - st.value);
    }
  }

  useEffect(() => {
    setCurFlagState(flagsState);
    updateCurFlagsFromState();
  }, [flagsState]);

  return (
    <>
        {Object.keys(flagStatuses).length ? (
          Object.keys(flagStatuses).map((st, i) => (
            <Form.Group key={i} className="main-form-element">
              <Form.Check
                id={st}
                checked={flagStatuses[st].checked}
                onChange={(e) => {
                  updateStateFromFlagCheck(flagStatuses[st], e.target.checked);
                }}
                inline
              />
              <Form.Label>{st.replaceAll('_',' ')}</Form.Label>

            </Form.Group>
          ))
        ) : (
          <></>
        )}
    </>
  );
};
export default ServerSetupFlags;
