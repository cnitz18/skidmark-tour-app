/* eslint-disable no-unused-vars */
import React from 'react'
import NewServerSetupPageHeader from './NewServerSetupPageHeader'
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import postAPIData from "../../utils/postAPIData";
import getAPIData from "../../utils/getAPIData";
import ServerSessionSetup from "../ServerSetup/ServerSessionSetup";
import ConvertFieldToInput from "../../utils/ConvertFieldToInput";
import SlotsDropdown from "../ServerSetup/SlotsDropdown";
import ServerSetupField from "../ServerSetup/ServerSetupField";
import ServerSetupSavePresetModal from "../ServerSetup/ServerSetupSavePresetModal";
import ServerSetupLoadPresetModal from "../ServerSetup/ServerSetupLoadPresetModal";
import ServerSetupStatus from "../ServerSetup/ServerSetupStatus";
import ServerSetupControls from "../ServerSetup/ServerSetupControls";
import DedicatedServerCommands from "../../utils/Classes/DedicatedServerCommands";
import WebServerCommands from "../../utils/Classes/WebServerCommands";
import ServerSetupFlags from '../ServerSetup/ServerSetupFlags';
import { Card, Container, Toast, ToastContainer, Row, Offcanvas, ListGroup, Table } from 'react-bootstrap';
import NewServerUnavailablePage from './NewServerUnavailablePage';

export default function NewServerSetupPage({ enums, lists }) {
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
    const [flagAttr,setFlagAttr] = useState({});
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
    const [presetForViewing,setPresetForViewing] = useState({});
    const [showSave, setShowSave] = useState(false);
    const [showLoad, setShowLoad] = useState(false);
    const [showOffcanvas,setShowOffcanvas] = useState(false);
    const handleCloseOffcanvas = () => setShowOffcanvas(false);
    const handleShowOffcanvas = () => setShowOffcanvas(true);
    const handleCloseSave = () => setShowSave(false);
    const handleShowSave = () => setShowSave(true);
    const handleCloseLoad = () => setShowLoad(false);
    const handleShowLoad = () => loadPresetList().then(() => setShowLoad(true));
  
    async function loadServerSetup() {
      let status;
      try{
        status = await postAPIData(
          "/api/session/status",
          { attributes: true },
          true
        );
        console.log('server state:',status.state)
      }catch(err){
        console.error(err);
        console.log('lets put up a thing here!')
        setServerState('unavailable');
        return;
      }

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
        setFlagAttr( inputInfo.find((inp) => inp.inputType === "flags" ))
        if (lists && Object.keys(lists).length) {
          let curList = [...lists["vehicle_classes"].list];
          let sortedList = curList.sort((a, b) => a.name.localeCompare(b.name));
          // console.log('setting sorted vehicle:',sortedList)
          setSortedVehicleList([...sortedList]);
        }
      }
    }
    async function loadPresetList() {
      let list = await getAPIData("/db/racepresets");
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
            console.log("showing toast....");
            setToastVariant("Success");
            setToastMessage("Server settings saved");
            setToastBody("");
            setShowToast(true);
            setShowSpinner(false);
            setDisableFields(false);
            //window.alert("Session settings sent, response: " + res.statusText);
          } else {
            setDifficultyError(true);
            setToastVariant("Danger");
            setToastMessage("Error when saving settings");
            setToastBody(`Server sent a status code of ${res.status}`);
            setShowToast(true);
            setShowSpinner(false);
            setDisableFields(false);
            // window.alert(
            //   `Session setting load failed with code "${res.status}" and reason: "${res.statusText}"`
            // );
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
    function handleViewPreset(preset, e){
      console.log('handleViewPreset');
      setPresetForViewing(preset);
      handleShowOffcanvas();
      console.log(preset);
    }
    function translateField( fieldName, fieldValue ){
      if( fieldName === 'TrackId' ){
        let list = lists.tracks;
        if( list && list.list ) 
          return list.list.find((t) => t.id === fieldValue)?.name?.replaceAll('_',' ')
      } else if( fieldName === 'VehicleClassId' ){
        let list = lists.vehicle_classes;
        if( list && list.list ) 
          return list.list.find((t) => t.value === fieldValue)?.name?.replaceAll('_',' ')
      } else if( fieldName === 'VehicleModelId' || fieldName === "MultiClassSlot1" || fieldName === "MultiClassSlot2" || fieldName === "MultiClassSlot3" || fieldName === "MultiClassSlot4" || fieldName === "MultiClassSlot5" || fieldName === "MultiClassSlot6" || fieldName === "MultiClassSlot7" || fieldName === "MultiClassSlot8" || fieldName === "MultiClassSlot9" ){
        console.log(fieldValue)
        let list = lists.vehicles;
        if( list && list.list ) 
          return list.list.find((t) => t.id === fieldValue)?.name?.replaceAll('_',' ')
      } else if( fieldName === 'PracticeWeatherSlot1' || fieldName === 'PracticeWeatherSlot2' || fieldName === 'PracticeWeatherSlot3' || fieldName === 'PracticeWeatherSlot4' || fieldName === 'QualifyWeatherSlot1' || fieldName === 'QualifyWeatherSlot2' || fieldName === 'QualifyWeatherSlot3' || fieldName === 'QualifyWeatherSlot4'){
        console.log(enums); 
        let list = enums.weather;
        if( list && list.list ) 
          return list.list.find((t) => t.value === fieldValue)?.name?.replaceAll('_',' ')
      }
      else return fieldValue;
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
    <>
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
        <NewServerSetupPageHeader/>
        {
          serverState === "unavailable" ?
          <NewServerUnavailablePage/>
          :
          ( serverState === "Idle" || serverState === "Running" ? 
            <Container>
                <Row>
                    {/* <!-- Blog entries--> */}
                    <div className="col-lg-8">
                        {/* <!-- Featured blog post--> */}
                        <Card className="mb-4">
                            <Card.Header>
                                General Server Settings
                            </Card.Header>
                            <Card.Body>
                                    <div className="setup-3">
                                    {attrInputInfo.length &&
                                        Object.keys(enums).length &&
                                        Object.keys(lists).length ? 
                                        (   
                                            <>
                                                {
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
                                                        attr.inputType === 'flags' ? <></> :
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
                                                            mainForm={true}
                                                        />
                                                    ))
                                                }
                                                {/* After all fields, include the Flags: */}
                                                {
                                                    flagAttr ? 
                                                    <div>
                                                        <hr/>
                                                        <ServerSetupFlags
                                                        flags={lists[flagAttr.typeListName]}
                                                        flagsState={state[flagAttr.name]}
                                                        updateState={updateState}
                                                        attr={flagAttr}
                                                        />
                                                    </div>
                                                    :<></>

                                                }
                                            </>
                                        ) : (
                                        <></>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                        {
                          multiClassSlotsAttrs.length &&
                          sortedVehicleList &&
                          sortedVehicleList.length ?
                          (
                            <Card className="mb-4">
                              <Card.Header>
                                Multi-Class Settings
                              </Card.Header>
                              <Card.Body>
                              <SlotsDropdown
                                  numSlotsAttr={multiClassNumSlots}
                                  slotsAttrs={multiClassSlotsAttrs}
                                  state={state}
                                  updateState={updateState}
                                  list={sortedVehicleList}
                                />
                              </Card.Body>
                            </Card>
                          ) : <></>
                        }
                        
                    </div>
                    {/* <!-- Side widgets--> */}
                    <div className="col-lg-4">
                        {/* <!-- Search widget--> */}
                        <Card className="mb-4">
                            <Card.Header>Server Commands</Card.Header>
                            <Card.Body>
                                <ServerSetupControls
                                    sendServerSetup={sendSetupToServer}
                                    handleShowSave={handleShowSave}
                                    handleShowLoad={handleShowLoad}
                                    advanceSession={advanceSession}
                                    showSpinner={showSpinner}
                                />
                            </Card.Body>
                        </Card>
                        {/* <!-- Race Session widget--> */}
                        <Card className="mb-4">
                            <Card.Header>Race</Card.Header>
                            <Card.Body>
                            <ServerSessionSetup
                                fieldList={raceSettings}
                                state={state}
                                enums={enums}
                                updateState={updateState}
                            />
                            </Card.Body>
                        </Card>
                        {/* <!-- Qualifying Session widget--> */}
                        <Card className="mb-4">
                            <Card.Header>Qualifying</Card.Header>
                            <Card.Body>
                            <ServerSessionSetup
                                fieldList={qualiSettings}
                                state={state}
                                enums={enums}
                                updateState={updateState}
                                />
                            </Card.Body>
                        </Card>
                        {/* <!-- Practice Session widget--> */}
                        <Card className="mb-4">
                            <Card.Header>Practice</Card.Header>
                            <Card.Body>
                            <ServerSessionSetup
                                fieldList={practiceSettings}
                                state={state}
                                enums={enums}
                                updateState={updateState}
                                />
                            </Card.Body>
                        </Card>
                    </div>
                </Row>
            </Container> :
            <></>
          )
        }
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
                handleViewPreset={handleViewPreset}
                />   
        {/* OffCanvas for viewing current Preset */}
        <Offcanvas show={showOffcanvas} onHide={handleCloseOffcanvas} placement="end" style={{zIndex:2000}}>
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>"{presetForViewing?.PresetName}" Preset Settings</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>d
            {
              presetForViewing ?
              (
                <Table striped bordered>
                  <tbody>
                    {Object.keys(presetForViewing).map((fieldName,i) => (
                      <tr key={i} horizontal="xxl">
                        <td>
                          {fieldName}
                        </td>
                        <td>
                          {translateField(fieldName,presetForViewing[fieldName])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )
              :<>No presteForViewing</>
            }
          </Offcanvas.Body>
        </Offcanvas>
    </>
  )
}
