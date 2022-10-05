import { useState, useEffect } from 'react';
import postAPIData from '../../utils/postAPIData';
import getAPIData from '../../utils/getAPIData';
import { Accordion, Button, Modal } from 'react-bootstrap';
import ServerSessionSetup from './ServerSessionSetup';
import ConvertFieldToInput from '../../utils/ConvertFieldToInput';
import ServerStatusField from './ServerStatusField';
import SlotsDropdown from './SlotsDropdown';
import ServerSetupField from './ServerSetupField';
import ServerSetupWarning from './ServerSetupWarning';
import { wait } from '@testing-library/user-event/dist/utils';

const ServerSetupForm = ({ enums, lists }) => {
    const [serverState,setServerState] = useState('');
    const [serverMessage,setServerMessage] = useState('');

    const [state,setState] = useState({});
    const [stateUpdated,setStateUpdated] = useState({});
    const [attrInputInfo,setAttrInputInfo] = useState([]);
    const [practiceSettings,setPracticeSettings] = useState([]);
    const [qualiSettings,setQualiSettings] = useState([]);
    const [raceSettings,setRaceSettings] = useState([]);
    const [multiClassNumSlots,setMultiClassNumSlots] = useState({});
    const [multiClassSlotsAttrs,setMultiClassSlotsAttrs] = useState({});
    const [sortedVehicleList,setSortedVehicleList] = useState([]);

    //Modal definitions
    const [PresetList,setPresetList] = useState([]);
    const [PresetName,setPresetName] = useState('');
    const [showSave, setShowSave] = useState(false);

    const handleCloseSave = () => setShowSave(false);
    const handleShowSave = () => setShowSave(true);

    const [showLoad, setShowLoad] = useState(false);

    const handleCloseLoad = () => setShowLoad(false);
    const handleShowLoad = () => loadPresetList().then(() => setShowLoad(true));

    function updateState( fieldName, val ){
        //console.log(`setting sttate(${fieldName},${val})...`)
        setState((prevState)=>{
            let updState = Object.assign({},prevState);
            updState[fieldName] = val;
            //console.log('updState:',updState);
            return { ...updState };
        });
        setStateUpdated((prevState) =>{
            let updState = Object.assign({},prevState);
            updState[fieldName] = true;
            //console.log('updState:',updState);
            return { ...updState };
        })
        //console.log('state now:',state[fieldName]);
        //console.log('stateUpdated now:',stateUpdated[fieldName])
    }
    async function loadServerSetup(){
        let status = await postAPIData('/api/session/status',{ attributes : true },true);
        setServerState(status.state);
        let attrList = await getAPIData('/api/list/attributes/session');
        if( attrList.list ){
            let inputInfo = [];
            setState({ ...status.attributes })
            let obj = {};
            Object.keys(status.attributes).forEach(a => obj[a] = false);
            setStateUpdated({ ...obj })
            attrList.list.forEach(a => {
                inputInfo.push(
                    ConvertFieldToInput(a,state)
                );
            });
            inputInfo.sort((a,b) => a.disabled);

            setPracticeSettings([ ...inputInfo.filter(x => x.name.startsWith('Practice'))]);
            setQualiSettings([ ...inputInfo.filter(x => x.name.startsWith('Qualify'))]);
            setRaceSettings([...inputInfo.filter(x => x.name.startsWith('Race'))]);
            setMultiClassNumSlots({ ...inputInfo.find(x => x.name === "MultiClassSlots")});
            setMultiClassSlotsAttrs([ ...inputInfo.filter( x => x.name.startsWith('MultiClassSlot') && x.name !== "MultiClassSlots")]);
            setAttrInputInfo([...inputInfo]); 
            if( lists && Object.keys(lists).length ){
                let curList = [ ...lists['vehicle_classes'].list ];
                let sortedList = curList.sort((a,b) => a.name.localeCompare(b.name));
                setSortedVehicleList([ ...sortedList ])
            }
        }
    }
    async function loadPresetList(){
        let list = await getAPIData('/db/presets');
        setPresetList([...list]);
        console.log('list length:',list.length);
    }
    function getUpdatedState(){
        //refactor here
    }
    function sendServerSetup(e){
        e.preventDefault();
        //console.log('sendServerSEtup called:::')
        //console.log(state);

        let newStateUpdated = { ...stateUpdated };
        let postState = {};
        for( let field in stateUpdated ){
            if( stateUpdated[field] ){
                postState['session_'+field] = state[field];
                newStateUpdated[field] = false;
            }
        }
        console.log("postState:'",postState);
        setStateUpdated(() =>{
            return { ...newStateUpdated };
        })
        postAPIData(
            '/api/session/set_attributes',
            postState
        ).then((res) => {
            window.alert('Session settings sent, received response:',res.status);
            console.log("post response:",res);
        })
    }
    function saveServerSetup(e){
        e.preventDefault();
        //console.log('saveServerSetup called:::')
        //console.log(state);

        let newStateUpdated = { ...stateUpdated };
        let postState = {};
        for( let field in stateUpdated ){
            if( stateUpdated[field] ){
                postState['session_'+field] = state[field];
                newStateUpdated[field] = false;
            }
        }
        console.log("postState:'",postState);
        setStateUpdated(() =>{
            return { ...newStateUpdated };
        })
        postAPIData(
            '/db/presets/add',
            { PresetName, ...stateUpdated }
        ).then((res) => {
            handleCloseSave();
            setPresetName('');
            window.alert('Session settings saved as preset, received response:',res.status);
            console.log("post response:",res);
        })
    }
    function handleLoadPreset(preset,e){
        console.log('handleLoadPreset')
        console.log(preset);
        setStateUpdated(() =>{
            return { ...preset };
        })        
        console.log('waiting...')
        setTimeout(() => {
            sendServerSetup(e)
            console.log('sent!!!!',preset.PresetName);
            handleCloseLoad();
        },1000);

    }
    function sendServerMessage(){
        //console.log('Sending message:',serverMessage)
        postAPIData('/api/session/send_chat',{ message: serverMessage }).then((res) => {
            window.alert('Message Sent');
        })
    }
    function advanceSession(){
        getAPIData('/api/session/advance')
        .then((res) => {
            window.alert("Session advance command sent, response:  '" + (res ? res.result : '') +"'")
        })
    }
    useEffect(() => {
        loadServerSetup();
        loadPresetList();
    },[lists])
    
    return (
        <div>
            <ServerSetupWarning show={false}/>
            <div className="setup-3">
                <h1>Basic Server Setup</h1>
                <div className='setup'>
                    <span>Status:       </span>
                    {
                        serverState === 'Running' ?
                        <Button variant="outline-success" disabled>Running</Button> :
                        (
                            serverState === 'Idle' ?
                            <Button variant="outline-warning" disabled>Idle</Button> :
                            <Button variant="outline-danger" disabled>Server Status Unexpected!</Button>
                            )
                        }
                </div>
                <Button style={{ float: 'right'}} variant="danger" onClick={advanceSession}>Advance Session</Button>
            </div>
            <br/>
            <br/>
            <form onSubmit={ sendServerSetup }>
                <div>
                    <div className="setup-3">
                        <h4>General Settings</h4>
                        <div><button className="command" type='button' onClick={sendServerSetup}>Set Server</button></div>
                        <div>
                            <Button variant='outline-success' onClick={handleShowSave}>Save as Preset</Button>
                            <Button variant='outline-primary' onClick={handleShowLoad}>Load Existing Preset</Button>
                        </div>
                    </div>
                    <div className="setup-3">
                        {
                            attrInputInfo.length && Object.keys(enums).length && Object.keys(lists).length ?
                            attrInputInfo.filter(x => {
                                return !x.name.startsWith('Race') && !x.name.startsWith('Practice') 
                                && !x.name.startsWith('Qualify') && x.inputType !== 'none' && !x.name.includes('MultiClass')
                                && x.access !== "ReadOnly"
                            }).map(attr =>(
                                <ServerSetupField 
                                    attr={attr} 
                                    state={state} 
                                    enums={
                                        attr.inputType === 'enum' ? 
                                        enums[attr.enumListName].list :
                                        []
                                    }
                                    updateState={updateState} 
                                    list={ 
                                        attr.inputType==='list' || attr.inputType==='flags'? 
                                        lists[attr.typeListName] : 
                                        []
                                    }/>
                            )) :
                            <></>
                        }
                    </div>
                    {
                        multiClassSlotsAttrs.length && sortedVehicleList && sortedVehicleList.length ?
                        <SlotsDropdown 
                            numSlotsAttr={multiClassNumSlots} 
                            slotsAttrs={multiClassSlotsAttrs}
                            state={state}
                            updateState={updateState}
                            list={sortedVehicleList}/>  : <></>
                    }
                    <div className='session-section'>
                        <ServerSessionSetup 
                            fieldList={practiceSettings} 
                            state={state} 
                            header="Practice Settings:" 
                            enums={enums} 
                            updateState={updateState}/>
                        <ServerSessionSetup 
                            fieldList={qualiSettings} 
                            state={state} 
                            header="Qualifying Settings:" 
                            enums={enums}
                            updateState={updateState}/>
                    </div>
                    <ServerSessionSetup 
                        fieldList={raceSettings} 
                        state={state} 
                        header="Race Settings:" 
                        enums={enums} 
                        updateState={updateState}/>
                </div>
            </form>
            <br/><br/>
            <label>
                Send a Message!
                <input type='text' onInput={(e) => setServerMessage(e.target.value)}></input>
                <button type='button' onClick={sendServerMessage} className="command">Send</button>
            </label>
            <br/><br/>
            <div className="setup">
                <h4>Unsupported Fields(WIP): </h4>
                {
                    attrInputInfo.filter(x => x.inputType === 'none').map(attr =>(
                        <>{attr.readableName + ": (Current Value: " + state[attr.name] + " )"}<br/></>
                    ))
                }
            </div>
            {/* <h3> Read-Only Fields </h3>
            <div className="setup">
                {
                    attrInputInfo.filter(x => x.access==="ReadOnly").map((attr) =>(
                        <ServerStatusField 
                            statusField={attr} 
                            state={state[attr.name]}/>
                    ))
                }
            </div> */}
            <Modal show={showSave} onHide={handleCloseSave} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Saving Race Preset</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <label>
                        Enter Name for Preset:
                        <input type='text' onInput={(e) => setPresetName(e.target.value)} value={PresetName}></input>
                    </label>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseSave}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={saveServerSetup}>
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showLoad} onHide={handleCloseLoad} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Load Race Preset</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {
                        PresetList.map((preset,i) => (
                            <Accordion.Item eventKey={i}>
                                <Accordion.Header>
                                    { preset.PresetName ? preset.PresetName : '<unnamed>' }
                                    <Button style={{float: 'right'}}onClick={(e) => handleLoadPreset(preset,e)}>Load</Button>
                                </Accordion.Header>   
                            <Accordion.Body>
                                {/* 
                                 add some more details about the server/race here
                                */}
                            </Accordion.Body>
                            </Accordion.Item>
                        ))
                    }
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseLoad}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={loadServerSetup}>
                        Load
                    </Button>
                </Modal.Footer>
            </Modal>
            <br/> <br/> <br/>
            <div></div>
        </div>
    );
};
export default ServerSetupForm;