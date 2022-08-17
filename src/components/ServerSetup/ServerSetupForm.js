import { useState, useEffect } from 'react';
import postAPIData from '../../utils/postAPIData';
import Button from 'react-bootstrap/Button';

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

    function setCarClassById( classId ){
        console.log('setCarClassById:',classId,'classes:',carClasses.length)
        setSelectedCarClass(classId); 
        let curClass = carClasses.find(cls => cls.value === classId);
        if( curClass ){
            setSelectedCarClassName(curClass.name);
        }

    }
    function translateEnum( key, enumName ){
        switch(enumName){
            case 'damage':

            case 'tire_wear':

            case 'fuel_usage':

            case 'penalties':

            case 'allowed_view':

            case 'grid_positions':

            case 'pit_control':

            case 'livetrack_preset':

            case 'weather':

        }
    }
    async function loadServerSetup(){
        let status = await postAPIData('/api/session/status',{ attributes : true },true);
        let attr = status.attributes;
        // console.log('loadServerSetup!!!!:',attr);
        setServerState(status.state);
        setSelectedTrack(attr.TrackId);
        setCarClassById(attr.VehicleClassId);
        setBotLevel(attr.OpponentDifficulty);
        setRaceLength(attr.RaceLength);
        setQualiLength(attr.QualifyLength);
        setPracticeLength(attr.PracticeLength);

        //Set from matching enumerations

        console.log('enums:::',enums)  
        for( let e in enums ){
            console.log('e:',e);

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
            <form onSubmit={ sendServerSetup }>
                <div className="setup">
                    <label>
                        Server Name:
                        <input disabled id='inpServerName' name='inpServerName' type='text' onInput={(e) => setServerName(e.target.value)} value={serverName}></input>
                    </label>
                    <br/>
                    <label>
                        Car Classes:
                        <select onChange={e => { setCarClassById(e.target.value)}} value={selectedCarClass}>
                            {
                                carClasses.sort((a,b)=>a.name.localeCompare(b.name)).map((cls) => (
                                    <option value={cls.value} key={cls.value}>{cls.name}</option>
                                ))
                            }
                        </select>
                    </label>
                    {/* <br/>
                    <label>
                        Car Options:
                        <select onChange={e => setSelectedCar(e.target.value)} value={selectedCar}>
                            {
                                cars.filter(car => car.class === selectedCarClassName).sort((a,b)=>a.name.localeCompare(b.name)).map((car) => (
                                    <option value={car.id} key={car.id}>{car.name} ({car.class})</option>
                                ))
                            }
                        </select>
                    </label> */}
                    <br/>
                    <label>
                        Track Options: 
                        <select onChange={e => setSelectedTrack(e.target.value) } value={selectedTrack}>
                            {tracks.map((track) => (
                                <option value={track.id} key={track.id}>{track.name}</option>
                            ))}
                        </select>
                    </label>
                    <br/>
                    <label>
                        AI Level:
                        <input type="number" id="botLevel" value={botLevel} onChange={e=> setBotLevel(e.target.value)} min="50" max="100"></input>
                    </label>
                    <br/>
                    <label>
                        Practice Length (minutes):
                        <input type="number" id="practiceLength" value={practiceLength} onChange={e=> setPracticeLength(e.target.value)}></input>
                    </label>  
                    <br/>
                    <label>
                        Quali Length (minutes):
                        <input type="number" id="qualiLength" value={qualiLength} onChange={e=> setQualiLength(e.target.value)}></input>
                    </label>    
                    <br/> 
                    <label>
                        Race Length (laps):
                        <input type="number" id="raceLength" value={raceLength} onChange={e=> setRaceLength(e.target.value)}></input>
                    </label>
                    <br/>
                    {/* <label>
                        Plus One Lap?
                        <input type="radio" id="plusOneTrue" name="plusOneFalse" value={"true"} onSelect={e=> setPlusOneLap(e.target.value)}>True</input>
                        <input type="radio" id="plusOneFalse" name="plusOneFalse" value={"false"} onSelect={e=> setPlusOneLap(e.target.value)}>False</input>
                    </label> */}
                    <label>
                        Flags:<br/>
                        <input type="checkbox"></input>
                    </label>
                    <br/>
                </div>
                    <h1>Enums:</h1>
                    {
                        Object.keys(enums).map((e) => {
                            let displayName = '';
                            switch(e){
                                case 'damage':
                                    displayName = 'DamageType'
                                case 'tire_wear':
                                    displayName = 'TireWearType'
                                case 'fuel_usage':
                                    displayName = 'FuelUsageType'
                                case 'penalties':
                                    displayName = 'PenaltiesType'
                                case 'allowed_view':
                                    displayName = 'AllowedViews'
                                case 'grid_positions':
                                    displayName = 'GridLayout'
                                case 'pit_control':
                                    displayName = 'ManualPitStops'
                                case 'livetrack_preset':
                                    displayName = 'LiveTrackPresets'
                                case 'weather':
                                    displayName = 'WeatherEnums'
                            }
                            (<p>display name: displayName</p>)

                        })
                    }
            </form>
            <button className="command" type='button' onClick={sendServerSetup}>Set Server</button>
            <br/><br/><br/>
            {/* <h3>All Editable Field Information:</h3>
            {editableFields.map((field) => (
                <p className='field-entry'>
                    <b>Name:</b> {field.name} 
                    <br/>
                    <b>Type:</b> {field.type}
                    <br/>
                    <b>Description:  </b>
                    <small>{field.description}</small>
                </p>
            ))} */}
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