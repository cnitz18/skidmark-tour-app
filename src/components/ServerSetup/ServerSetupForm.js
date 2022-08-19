import { useState, useEffect } from 'react';
import postAPIData from '../../utils/postAPIData';
import getAPIData from '../../utils/getAPIData';
import Button from 'react-bootstrap/Button';
import ServerSessionSetup from './ServerSessionSetup';
import ConvertFieldToInput from '../../utils/ConvertFieldToInput';
import ServerStatusField from './ServerStatusField';
import SlotsDropdown from './SlotsDropdown';
import ServerSetupField from './ServerSetupField';

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
        }
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
            window.alert('Session settings sent.');
            console.log("post response:",res);
        })
    }
    function sendServerMessage(){
        //console.log('Sending message:',serverMessage)
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
                                        attr.inputType==='list' ? 
                                        lists[attr.typeListName].list : 
                                        []
                                    }/>
                            )) :
                            <></>
                        }
                    </div>
                    {
                        multiClassSlotsAttrs.length && lists['vehicle_classes'] ?
                        <SlotsDropdown 
                            numSlotsAttr={multiClassNumSlots} 
                            slotsAttrs={multiClassSlotsAttrs}
                            state={state}
                            updateState={updateState}
                            list={lists['vehicle_classes'].list}/>  : <></>
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

                    <div className="setup">
                        <h4>Unsupported fields</h4>
                        {attrInputInfo.filter(x => x.inputType === 'none').map(attr =>(
                                    <>{attr.readableName + ": (Current Value: " +  + " )"}<br/></>
                                ))
                        }
                    </div>
                </div>
            </form>
            <button className="command" type='button' onClick={sendServerSetup}>Set Server</button>
            <br/>
            <h3> Read-Only Fields </h3>
            <div className="setup">
                {
                    attrInputInfo.filter(x => x.access==="ReadOnly").map((attr) =>(
                        <ServerStatusField 
                            statusField={attr} 
                            state={state[attr.name]}/>
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