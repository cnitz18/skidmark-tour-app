/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import postAPIData from "../../utils/postAPIData";
import getAPIData from "../../utils/getAPIData";
import ServerSessionSetup from "./ServerSessionSetup";
import ConvertFieldToInput from "../../utils/ConvertFieldToInput";
import SlotsDropdown from "./SlotsDropdown";
import ServerSetupField from "./ServerSetupField";
import ServerSetupWarning from "./ServerSetupWarning";
import ServerSetupSavePresetModal from "./ServerSetupSavePresetModal";
import ServerSetupLoadPresetModal from "./ServerSetupLoadPresetModal";
import ServerSetupStatus from "./ServerSetupStatus";
import ServerSetupUnsupportedFields from "./ServerSetupUnsupportedFields";
import ServerSetupControls from "./ServerSetupControls";
import DedicatedServerCommands from "../../utils/Classes/DedicatedServerCommands";
import WebServerCommands from "../../utils/Classes/WebServerCommands";

const ServerSetupForm = ({ enums, lists }) => {
  const [serverState, setServerState] = useState("");
  const [serverMessage, setServerMessage] = useState("");
  const [serverFieldList, setServerFieldList] = useState([]);

  const [state, setState] = useState({});
  const [stateUpdated, setStateUpdated] = useState({});

  const [attrInputInfo, setAttrInputInfo] = useState([]);
  const [practiceSettings, setPracticeSettings] = useState([]);
  const [qualiSettings, setQualiSettings] = useState([]);
  const [raceSettings, setRaceSettings] = useState([]);
  const [multiClassNumSlots, setMultiClassNumSlots] = useState({});
  const [multiClassSlotsAttrs, setMultiClassSlotsAttrs] = useState({});
  const [sortedVehicleList, setSortedVehicleList] = useState([]);
  const [difficultyError, setDifficultyError] = useState(false);

  //Modal definitions
  const [PresetList, setPresetList] = useState([]);
  const [PresetName, setPresetName] = useState("");
  const [showSave, setShowSave] = useState(false);
  const [showLoad, setShowLoad] = useState(false);
  const handleCloseSave = () => setShowSave(false);
  const handleShowSave = () => setShowSave(true);
  const handleCloseLoad = () => setShowLoad(false);
  const handleShowLoad = () => loadPresetList().then(() => setShowLoad(true));

  async function loadServerSetup() {
    let status = await postAPIData(
      "/api/session/status",
      { attributes: true },
      true
    );
    setServerState(status.state);
    let attrList = await getAPIData("/api/list/attributes/session");
    if (attrList.list) {
      let inputInfo = [];
      let tempStateUpdated = {};
      let tempServerFieldList = [];
      Object.keys(status.attributes).forEach(
        (a) => (tempStateUpdated[a] = false)
      );
      attrList.list.forEach((a) => {
        inputInfo.push(ConvertFieldToInput(a, state));
        if (a.access === "ReadWrite") tempServerFieldList.push(a.name);
      });
      inputInfo.sort((a) => a.disabled);

      setState({ ...status.attributes });
      setStateUpdated({ ...tempStateUpdated });
      setServerFieldList([...tempServerFieldList]);
      setPracticeSettings([
        ...inputInfo.filter((x) => x.name.startsWith("Practice")),
      ]);
      setQualiSettings([
        ...inputInfo.filter((x) => x.name.startsWith("Qualify")),
      ]);
      setRaceSettings([...inputInfo.filter((x) => x.name.startsWith("Race"))]);
      setMultiClassNumSlots({
        ...inputInfo.find((x) => x.name === "MultiClassSlots"),
      });
      // console.log('setting slots attrs:',inputInfo.filter(
      //   (x) =>
      //     x.name.startsWith("MultiClassSlot") && x.name !== "MultiClassSlots"
      // ))
      setMultiClassSlotsAttrs([
        ...inputInfo.filter(
          (x) =>
            x.name.startsWith("MultiClassSlot") && x.name !== "MultiClassSlots"
        ),
      ]);
      setAttrInputInfo([...inputInfo]);

      if (lists && Object.keys(lists).length) {
        let curList = [...lists["vehicle_classes"].list];
        let sortedList = curList.sort((a, b) => a.name.localeCompare(b.name));
        // console.log('setting sorted vehicle:',sortedList)
        setSortedVehicleList([...sortedList]);
      }
    }
  }
  async function loadPresetList() {
    let list = await getAPIData("/db/presets");
    setPresetList([...list]);
    //console.log("list length:", list.length, list);
  }

  function updateState(fieldName, val) {
    //console.log("updateState:", fieldName, val);
    setState((prevState) => {
      let updState = Object.assign({}, prevState);
      updState[fieldName] = val;
      return { ...updState };
    });
    setStateUpdated((prevState) => {
      let updState = Object.assign({}, prevState);
      updState[fieldName] = true;
      return { ...updState };
    });
  }
  function sendSetupToServer(e) {
    e.preventDefault();
    let postState = {};
    let newStateUpdated = { ...stateUpdated };
    for (let field in stateUpdated) {
      if (stateUpdated[field]) {
        postState["session_" + field] = state[field];
        newStateUpdated[field] = false;
      }
    }
    setStateUpdated({ ...newStateUpdated });
    DedicatedServerCommands.setDedicatedServerState(
      postState,
      serverFieldList
    ).then((res) => {
      if (res.status === 200) {
        setDifficultyError(false);
        window.alert("Session settings sent, response: " + res.statusText);
      } else {
        setDifficultyError(true);
        window.alert(
          `Session setting load failed with code "${res.status}" and reason: "${res.statusText}"`
        );
        console.error(res);
      }
    });
  }
  function handleLoadPreset(preset, e) {
    e.preventDefault();
    // console.log("loadig...", preset);
    let newStateUpdated = {};
    let postState = {};
    for (let field in preset) {
      newStateUpdated[field] = true;
      if (field !== "_id" && field !== "PresetName")
        postState["session_" + field] = preset[field];
    }

    setState({ ...preset });
    setStateUpdated({ ...newStateUpdated });

    DedicatedServerCommands.setDedicatedServerState(
      postState,
      serverFieldList
    ).then((res) => {
      if (res.status === 200)
        window.alert("Preset loaded, response: " + res.statusText);
      else
        window.alert(
          `Preset load failed with code ${res.status} and reason ${res.statusText}`
        );
      //console.log("post response:", res);
      handleCloseLoad();
    });
  }
  function handleSavePreset(e) {
    e.preventDefault();

    let postState = {};
    //console.log("handleSavePreset:", Object.keys(state).length);
    for (let field in state) {
      postState[field] = state[field];
    }
    //console.log("postState:'", JSON.stringify(postState));

    WebServerCommands.savePreset(PresetName, postState, serverFieldList).then(
      (res) => {
        handleCloseSave();
        setPresetName("");
        //console.log("post response:", res);
      }
    );
  }
  function handleDeletePreset(presetID, e) {
    e.preventDefault();

    WebServerCommands.deletePreset(presetID).then((res) => {
      handleCloseLoad();
      window.alert("Preset deleted, response: " + res.statusText);
    });
  }
  function sendServerMessage() {
    //console.log('Sending message:',serverMessage)
    postAPIData("/api/session/send_chat", { message: serverMessage }).then(
      (res) => {
        //window.alert('Message Sent');
        //console.log("message sent");
      }
    );
  }
  function advanceSession() {
    getAPIData("/api/session/advance").then((res) => {
      window.alert(
        "Session advance command sent, response:  '" +
          (res ? res.result : "") +
          "'"
      );
    });
  }
  useEffect(() => {
    loadServerSetup();
    // console.log('multiClassSlotsAttrs:',multiClassSlotsAttrs);
    // console.log('sortedVehicleList:',sortedVehicleList)
  }, [lists]);

  return (
    <div>
      <ServerSetupWarning show={false} />
      <div className="setup-3">
        <h1>Basic Server Setup</h1>
        <ServerSetupStatus serverState={serverState} />
        <ServerSetupControls
          sendServerSetup={sendSetupToServer}
          handleShowSave={handleShowSave}
          handleShowLoad={handleShowLoad}
          advanceSession={advanceSession}
        />
      </div>
      <br />
      <br />
      <form onSubmit={sendSetupToServer}>
        <div>
          <div className="setup-3">
            {attrInputInfo.length &&
            Object.keys(enums).length &&
            Object.keys(lists).length ? (
              attrInputInfo
                .filter((x) => {
                  return (
                    !x.name.startsWith("Race") &&
                    !x.name.startsWith("Practice") &&
                    !x.name.startsWith("Qualify") &&
                    x.inputType !== "none" &&
                    !x.name.includes("MultiClass") &&
                    x.access !== "ReadOnly"
                  );
                })
                .sort((a, b) => b.inputType.localeCompare(a.inputType))
                .map((attr, i) => (
                  <ServerSetupField
                    key={i}
                    attr={attr}
                    state={state}
                    enums={
                      attr.inputType === "enum"
                        ? enums[attr.enumListName].list
                        : []
                    }
                    updateState={updateState}
                    list={
                      attr.inputType === "list" || attr.inputType === "flags"
                        ? lists[attr.typeListName]
                        : []
                    }
                    difficultyError={difficultyError}
                  />
                ))
            ) : (
              <></>
            )}
          </div>
          {multiClassSlotsAttrs.length &&
          sortedVehicleList &&
          sortedVehicleList.length ? (
            <SlotsDropdown
              numSlotsAttr={multiClassNumSlots}
              slotsAttrs={multiClassSlotsAttrs}
              state={state}
              updateState={updateState}
              list={sortedVehicleList}
            />
          ) : (
            <></>
          )}
          <div className="session-section">
            <ServerSessionSetup
              fieldList={practiceSettings}
              state={state}
              header="Practice Settings:"
              enums={enums}
              updateState={updateState}
            />
            <ServerSessionSetup
              fieldList={qualiSettings}
              state={state}
              header="Qualifying Settings:"
              enums={enums}
              updateState={updateState}
            />
          </div>
          <ServerSessionSetup
            fieldList={raceSettings}
            state={state}
            header="Race Settings:"
            enums={enums}
            updateState={updateState}
          />
        </div>
      </form>
      <br />
      <br />
      <label>
        Send a Message!
        <input
          type="text"
          onInput={(e) => setServerMessage(e.target.value)}
        ></input>
        <button type="button" onClick={sendServerMessage} className="command">
          Send
        </button>
      </label>
      <br />
      <br />
      <ServerSetupUnsupportedFields
        attrInputInfo={attrInputInfo}
        state={state}
      />
      <ServerSetupSavePresetModal
        showSave={showSave}
        handleCloseSave={handleCloseSave}
        PresetName={PresetName}
        handleSavePreset={handleSavePreset}
        setPresetName={setPresetName}
      />
      <ServerSetupLoadPresetModal
        showLoad={showLoad}
        handleCloseLoad={handleCloseLoad}
        PresetList={PresetList}
        handleDeletePreset={handleDeletePreset}
        handleLoadPreset={handleLoadPreset}
      />
      <br /> <br /> <br />
      <div></div>
    </div>
  );
};
export default ServerSetupForm;
