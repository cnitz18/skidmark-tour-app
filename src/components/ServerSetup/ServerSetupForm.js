/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import postAPIData from "../../utils/postAPIData";
import getAPIData from "../../utils/getAPIData";
import ServerSessionSetup from "./ServerSessionSetup";
import ConvertFieldToInput from "../../utils/ConvertFieldToInput";
import SlotsDropdown from "./SlotsDropdown";
import ServerSetupField from "./ServerSetupField";
import ServerSetupSavePresetModal from "./ServerSetupSavePresetModal";
import ServerSetupLoadPresetModal from "./ServerSetupLoadPresetModal";
import ServerSetupStatus from "./ServerSetupStatus";
import ServerSetupControls from "./ServerSetupControls";
import DedicatedServerCommands from "../../utils/Classes/DedicatedServerCommands";
import WebServerCommands from "../../utils/Classes/WebServerCommands";
import { Toast, Col, Row, ToastContainer } from "react-bootstrap";

const ServerSetupForm = ({ enums, lists }) => {
  const [serverState, setServerState] = useState("");
  const [serverMessage, setServerMessage] = useState("");
  const [serverFieldList, setServerFieldList] = useState([]);
  const [toastVariant, setToastVariant] = useState("");
  const [toastBody, setToastBody] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [disableFields, setDisableFields] = useState(false);

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
        setSortedVehicleList([...sortedList]);
      }
    }
  }
  async function loadPresetList() {
    let list = await getAPIData("/db/racepresets");
    setPresetList([...list]);
  }

  function updateState(fieldName, val) {
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
    setShowSpinner(true);
    setDisableFields(true);
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
    DedicatedServerCommands.setDedicatedServerState(postState, serverFieldList)
      .then((res) => {
        if (res.status === 200) {
          setDifficultyError(false);
          setToastVariant("Success");
          setToastMessage("Server settings saved");
          setToastBody("");
          setShowToast(true);
          setShowSpinner(false);
          setDisableFields(false);
        } else {
          setDifficultyError(true);
          setToastVariant("Danger");
          setToastMessage("Error when saving settings");
          setToastBody(`Server sent a status code of ${res.status}`);
          setShowToast(true);
          setShowSpinner(false);
          setDisableFields(false);

          console.error(res);
        }
      })
      .catch((err) => {
        setDifficultyError(true);
        setToastVariant("Danger");
        setToastMessage("Error when saving settings");
        setToastBody(`Server errored out with message: "${err.body}"`);
        setShowToast(true);
        setShowSpinner(false);
        setDisableFields(false);
      });
  }
  function handleLoadPreset(preset, e) {
    e.preventDefault();
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
      handleCloseLoad();
    });
  }
  function handleSavePreset(e) {
    e.preventDefault();

    let postState = {};
    for (let field in state) {
      postState[field] = state[field];
    }

    WebServerCommands.savePreset(PresetName, postState, serverFieldList).then(
      (res) => {
        handleCloseSave();
        setPresetName("");
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
    postAPIData("/api/session/send_chat", { message: serverMessage }).then(
      (res) => {
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
  }, [lists]);

  return (
    <div>
      <ToastContainer position="top-center">
        <Toast
          className="d-inline-block m-1"
          bg={toastVariant.toLowerCase()}
          onClose={() => setShowToast(false)}
          show={showToast}
          autohide
        >
          <Toast.Header>
            <span className="me-auto">{toastMessage}</span>
          </Toast.Header>
          {toastBody ? <Toast.Body>{toastBody}</Toast.Body> : <></>}
        </Toast>
      </ToastContainer>
      <Row>
        <Col>
          <h1>Server Setup</h1>
        </Col>
        <Col>
          <ServerSetupStatus serverState={serverState} />
        </Col>
        <Col>
          <ServerSetupControls
            sendServerSetup={sendSetupToServer}
            handleShowSave={handleShowSave}
            handleShowLoad={handleShowLoad}
            advanceSession={advanceSession}
            showSpinner={showSpinner}
          />
        </Col>
      </Row>
      <br />
      <br />
      <form onSubmit={sendSetupToServer}>
        <fieldset disabled={disableFields}>
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
        </fieldset>
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
