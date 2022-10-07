import React from "react";

export default function ServerSetupUnsupportedFields({ attrInputInfo, state }) {
  return (
    <div className="setup">
      <h4>Unsupported Fields(WIP): </h4>
      {attrInputInfo
        .filter((x) => x.inputType === "none")
        .map((attr, i) => (
          <span key={i}>
            {attr.readableName + ": (Current Value: " + state[attr.name] + " )"}
            <br />
          </span>
        ))}
    </div>
  );
}
