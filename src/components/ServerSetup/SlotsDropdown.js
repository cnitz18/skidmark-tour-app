import { useEffect } from "react";
import ServerSetupField from "./ServerSetupField";
import Accordion from "react-bootstrap/Accordion";

const SlotsDropdown = ({
  numSlotsAttr,
  slotsAttrs,
  state,
  updateState,
  enums,
  list,
  bodyClass,
}) => {
  useEffect(() => {
  }, [list]);
  return (
    <Accordion>
      <Accordion.Item eventKey="0">
        <Accordion.Header>
          <ServerSetupField
            attr={numSlotsAttr}
            state={state}
            updateState={updateState}
            list={list}
          />
        </Accordion.Header>
        <Accordion.Body className="setup">
          {slotsAttrs?.sort().map((attr, i) => (
            <ServerSetupField
              key={i}
              attr={attr}
              state={state}
              updateState={updateState}
              enums={attr.isEnum ? enums[attr.enumListName].list : []}
              list={list}
            />
          ))}
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  );
};
export default SlotsDropdown;
