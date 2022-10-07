import React from "react";
import { useEffect, useState } from "react";

export default function ServerSetupOpponentDifficulty({
  updateState,
  state,
  attr,
  difficultyError,
}) {
  const [diff, setDiff] = useState(70);

  function updateStateFromInput(val) {
    // console.log('setting ')
    let updatedVal = (val - 70) * 2;
    //console.log('setting state:',updatedVal)
    updateState(attr.name, updatedVal);
  }
  function updateInputFromState() {
    let val = state[attr.name];
    //console.log('setting inpt:',70 + Math.round(val/2))
    setDiff(70 + Math.round(val / 2));
  }
  useEffect(() => {
    updateInputFromState();
  }, [state]);
  return (
    <input
      type="number"
      value={diff}
      min="70"
      max="120"
      onChange={(e) => updateStateFromInput(e.target.value)}
      style={difficultyError ? { border: "1px solid red" } : {}}
    ></input>
  );
}
