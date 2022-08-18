import { useState, useEffect } from 'react';
import postAPIData from '../../utils/postAPIData';
import getAPIData from '../../utils/getAPIData';
import Button from 'react-bootstrap/Button';
import ServerSessionSetup from './ServerSessionSetup';
import ConvertFieldToInput from '../../utils/ConvertFieldToInput';
import ServerStatusField from './ServerStatusField';
import SlotsDropdown from './SlotsDropdown';
import ServerSetupField from './ServerSetupField';

const ServerSetupForm = ({ editableFields, cars, tracks, carClasses, flags, enums }) => {
    const [serverState,setServerState] = useState('');
    const [serverMessage,setServerMessage] = useState('');


    const [state,setState] = useState({});
    const [attrInputInfo,setAttrInputInfo] = useState([]);
    const [practiceSettings,setPracticeSettings] = useState([]);
    const [qualiSettings,setQualiSettings] = useState([]);
    const [raceSettings,setRaceSettings] = useState([]);
    const [multiClassNumSlots,setMultiClassNumSlots] = useState({});
    const [multiClassSlotsAttrs,setMultiClassSlotsAttrs] = useState({});
    function updateState( fieldName, val ){
        setState((prevState)=>{
            let updState = Object.assign({},prevState);
            updState[fieldName] = val;
            console.log('updState:',updState);
            return { ...updState };
        });
        console.log('state now:',state);
    }
    async function loadServerSetup(){
        let status = await postAPIData('/api/session/status',{ attributes : true },true);
        setServerState(status.state);
        let attrList = await getAPIData('/api/list/attributes/session');
        // console.log('attrList:',attrList)
        if( attrList.list ){
            let inputInfo = [];
            setState({ ...status.attributes })
            attrList.list.forEach(a => {
                //updateState(a.name,status.attributes[a.name]);
                //console.log('a:',a)
                inputInfo.push(
                    ConvertFieldToInput(a,state)
                );
            });
            inputInfo.sort((a,b) => a.disabled)
            console.log('inputInfo:',inputInfo);
            setPracticeSettings([ ...inputInfo.filter(x => x.name.startsWith('Practice'))]);
            setQualiSettings([ ...inputInfo.filter(x => x.name.startsWith('Qualify'))]);
            setRaceSettings([...inputInfo.filter(x => x.name.startsWith('Race'))]);
            setMultiClassNumSlots({ ...inputInfo.find(x => x.name === "MultiClassSlots")});
            setMultiClassSlotsAttrs([ ...inputInfo.filter( x => x.name.startsWith('MultiClassSlot') && x.name !== "MultiClassSlots")]);
            console.log('num',multiClassNumSlots);
            console.log('attr',multiClassSlotsAttrs);
            setAttrInputInfo([...inputInfo]);
        }
    }
    function sendServerSetup(e){
        // console.log('Setup server with name:',serverName,'car:',selectedCar,'track:',selectedTrack,'sel:',selectedCarClass,selectedCarClassName);
        e.preventDefault();
        console.log('sendServerSEtup called:::')
        console.log(state);
        // postAPIData(
        //     '/api/session/set_attributes',
        //     {
        //         //session_Name: serverName,
        //         session_VehicleClassId: selectedCarClass,
        //         session_VehicleModelId: selectedCar,
        //         session_TrackId: selectedTrack,
        //         session_OpponentDifficulty: botLevel,
        //         session_PracticeLength: practiceLength,
        //         session_QualifyLength: qualiLength, 
        //         session_RaceLength: raceLength
        //     }
        // ).then((res) => {
        //     window.alert('session settings sent');
        //     console.log(res);
        // })
    }
    function sendServerMessage(){
        console.log('Sending message:',serverMessage)
        postAPIData('/api/session/send_chat',{ message: serverMessage }).then((res) => {
            window.alert('Message Sent');
        })
    }
    useEffect(() => {
        loadServerSetup();
    },[])

    return (
        <p>
            <div className='setup'>
                <h3>Basic Server Setup</h3>
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
            <form onSubmit={ sendServerSetup }>
                <div>
                    <div className="setup">
                        <h4>General Settings</h4>
                        {
                            attrInputInfo.filter(x => {
                                return !x.name.startsWith('Race') && !x.name.startsWith('Practice') && !x.name.startsWith('Qualify') && x.inputType !== 'none' && !x.name.includes('MultiClass')
                            }).map(attr =>(
                                <ServerSetupField attr={attr} state={state} enums={enums} updateState={updateState}/>
                            ))
                        }
                    </div>
                    {
                        multiClassSlotsAttrs.length ?
                        <SlotsDropdown 
                            numSlotsAttr={multiClassNumSlots} 
                            slotsAttrs={multiClassSlotsAttrs}
                            state={state}
                            updateState={updateState}
                            enums={enums}/>  : <></>
                    }
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
                    <ServerSessionSetup 
                        fieldList={raceSettings} 
                        state={state} 
                        header="Race Settings:" 
                        enums={enums} 
                        updateState={updateState}/>

                    {/* <div className="setup">
                        <h4>Qualifying Settings:</h4>
                        {
                            qualiSettings.map((attr) => (
                                <>{attr.readableName}<br/></>
                            ))
                        }
                    </div>
                    <div className="setup">
                        <h4>Race Settings:</h4>
                        {
                            raceSettings.map((attr) => (
                                <>{attr.readableName} ({state[attr.name].value})<br/></>
                            ))
                        }
                    </div> */}
                    <div className="setup">
                        <h4>Unsupported fields</h4>
                        {attrInputInfo.filter(x => x.inputType === 'none').map(attr =>(
                                    <>{attr.readableName}<br/></>
                                ))
                        }
                    </div>
                    {/* {console.log('writable:',writableAttributes)}
                    {
                        writableAttributes ?
                        writableAttributes.map((attr) => (
                            <ServerSetupField attr={attr} field={attr.name} setField={(x) => updateState(x,attr.name)} enums={enums}/>
                        )) :
                        <>Writeable Attributes not found</>
                    }
                    {
                        
                    } */}
                </div>
            </form>
            <button className="command" type='button' onClick={sendServerSetup}>Set Server</button>
            <br/>
            <h3> Read-Only Fields </h3>
            <div className="setup">
                Read Only Fields:
                {
                    attrInputInfo.filter(x => x.access==="ReadOnly").map((attr) =>(
                        <ServerStatusField statusField={attr} state={state[attr.name]}/>
                    ))
                }
            </div>
            <label>
                Send a Message!
                <input type='text' onInput={(e) => setServerMessage(e.target.value)}></input>
                <button type='button' onClick={sendServerMessage} className="command">Send</button>
            </label>
            <br/> <br/> <br/>
        </p>
    );
};
export default ServerSetupForm;