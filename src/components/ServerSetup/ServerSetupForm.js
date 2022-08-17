import { useState, useEffect } from 'react';
import postAPIData from '../../utils/postAPIData';
import getAPIData from '../../utils/getAPIData';
import Button from 'react-bootstrap/Button';
import ServerSetupField from './ServerSetupField';
import ConvertFieldToInput from '../../utils/ConvertFieldToInput';
import ServerStatusField from './ServerStatusField';

const ServerSetupForm = ({ editableFields, cars, tracks, carClasses, flags, enums }) => {
    const [serverState,setServerState] = useState('');
    const [serverName,setServerName] = useState('Skidmark Tour Official Server');
    const [serverMessage,setServerMessage] = useState('');
    const [selectedCarClass,setSelectedCarClass] = useState(0);
    const [selectedCarClassName,setSelectedCarClassName] = useState('')
    const [selectedCar,setSelectedCar] = useState(0);
    const [selectedTrack,setSelectedTrack] = useState(0);
    const [botLevel,setBotLevel] = useState(85);
    const [practiceLength,setPracticeLength] = useState(0);
    const [qualiLength,setQualiLength] = useState(0);
    const [plusOneLap,setPlusOneLap] = useState(false);
    const [raceLength,setRaceLength] = useState(5);
    const [damageType,setDamageType] = useState(0);
    const [tireWearType,setTireWearType] = useState(0);
    const [fuelUsageType,setFuelUsageType] = useState(0);
    const [penalty,setPenalty] = useState(0);
    const [allowedViews,setAllowedViews] = useState(0);
    const [gridPos,setGridPos] = useState(0);
    const [pitControl,setPitControl] = useState(0);

    const [state,setState] = useState({});
    const [writableAttributes,setWritableAttributes] = useState([]);
    const [readOnlyAttributes,setReadOnlyAttributes] = useState([]);
    const [attrInputInfo,setAttrInputInfo] = useState([]);

    function updateState( fieldName, val ){
        setState((prevState)=>{
            let updState = Object.assign({},prevState);
            updState[fieldName] = val;
            console.log('updState:',updState);
            return { ...updState };
        });
        console.log('state now:',state);
    }
    function setCarClassById( classId ){
        console.log('setCarClassById:',classId,'classes:',carClasses.length);
        setSelectedCarClass(classId); 
        let curClass = carClasses.find(cls => cls.value === classId);
        if( curClass ){
            setSelectedCarClassName(curClass.name);
        }

    }
    async function loadServerSetup(){
        let status = await postAPIData('/api/session/status',{ attributes : true },true);
        setServerState(status.state);
        let attrList = await getAPIData('/api/list/attributes/session');
        // setWritableAttributes(() => [...attrList.list]);
        // console.log('state:',serverState,'attrs:',writableAttributes.length,attrList.list.length)
        //let readOnlyAttrList = attrList.filter(a => a.access = 'ReadOnly');
        // console.log('readOnly:',readOnlyAttrList)
        console.log('attrList:',attrList)
        if( attrList.list ){
            let inputInfo = [];
            setState({ ...status.attributes })
            attrList.list.forEach(a => {
                //updateState(a.name,status.attributes[a.name]);
                //console.log('a:',a)
                inputInfo.push(
                    ConvertFieldToInput(a)
                );
            });
            inputInfo.sort((a,b) => a.disabled)
            setAttrInputInfo([...inputInfo]);
            console.log('inputInfo:',inputInfo);
            setWritableAttributes([...attrList.list.filter(a => a.access === "ReadWrite")]);
            setReadOnlyAttributes([...attrList.list.filter(a => a.access === "ReadOnly")]);

        }
    }
    function sendServerSetup(e){
        console.log('Setup server with name:',serverName,'car:',selectedCar,'track:',selectedTrack,'sel:',selectedCarClass,selectedCarClassName);
        e.preventDefault();
        postAPIData(
            '/api/session/set_attributes',
            {
                //session_Name: serverName,
                session_VehicleClassId: selectedCarClass,
                session_VehicleModelId: selectedCar,
                session_TrackId: selectedTrack,
                session_OpponentDifficulty: botLevel,
                session_PracticeLength: practiceLength,
                session_QualifyLength: qualiLength, 
                session_RaceLength: raceLength
            }
        ).then((res) => {
            window.alert('session settings sent');
            console.log(res);
        })
    }
    function sendServerMessage(){
        console.log('Sending message:',serverMessage)
        postAPIData('/api/session/send_chat',{ message: serverMessage }).then((res) => {
            window.alert('Message Sent');
        })
    }
    useEffect(() => {
        loadServerSetup();
    },[carClasses])

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
                        <h4>Practice Settings:</h4>
                        {
                            attrInputInfo.filter(x => x.name.startsWith('Practice')).map((attr) => (
                                <>{attr.readableName}<br/></>
                            ))
                        }
                    </div>
                    <div className="setup">
                        <h4>Qualifying Settings:</h4>
                        {
                            attrInputInfo.filter(x => x.name.startsWith('Qualify')).map((attr) => (
                                <>{attr.readableName}<br/></>
                            ))
                        }
                    </div>
                    <div className="setup">
                        <h4>Race Settings:</h4>
                        {
                            attrInputInfo.filter(x => x.name.startsWith('Race')).map((attr) => (
                                <>{attr.readableName} ({state[attr.name].value})<br/></>
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
                {/* {readOnlyAttributes.forEach((r) => {
                    ConvertFieldToInput(r.name,state[r.name],readOnlyAttributes)
                })} */}
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