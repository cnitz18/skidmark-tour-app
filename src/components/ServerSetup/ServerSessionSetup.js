import { useState, useEffect } from "react";
import ServerSetupField from "./ServerSetupField";
import SlotsDropdown from "./SlotsDropdown";

const ServerSessionSetup = ({
  fieldList,
  state,
  enums,
  updateState,
}) => {
  const [numSlotsAttr, setNumSlotsAttr] = useState({});
  const [slotsAttrs, setSlotsAttrs] = useState([]);
  const [otherSettings, setOtherSettings] = useState([]);
  useEffect(() => {
    if (fieldList) {
      let filteredList = fieldList.filter((f) => f.inputType !== "none");
      let weatherSettings = filteredList?.filter((x) =>
        x?.name?.includes("Weather")
      );
      setNumSlotsAttr({
        ...weatherSettings.find((x) => x?.name?.includes("WeatherSlots")),
      });
      setSlotsAttrs([
        ...weatherSettings.filter((x) => !x?.name?.includes("WeatherSlots")),
      ]);
      setOtherSettings([
        ...filteredList.filter((x) => !x?.name.includes("Weather")),
      ]);
    }
  }, [fieldList]);
  return (
    <>
      <div>
        {otherSettings.map((attr, i) => (
          <ServerSetupField
            key={i}
            attr={attr}
            state={state}
            enums={attr.isEnum ? enums[attr.enumListName]?.list : []}
            updateState={updateState}
          />
        ))}
      </div>
      <SlotsDropdown
        numSlotsAttr={numSlotsAttr}
        slotsAttrs={slotsAttrs}
        state={state}
        updateState={updateState}
        enums={enums}
      />
    </>
  );
};
export default ServerSessionSetup;
