import { useState, useEffect } from 'react';
import postAPIData from '../../utils/postAPIData';

const ServerSetupForm = ({ editableFields, cars, tracks, carClasses }) => {
    const [serverName,setServerName] = useState('Skidmark Tour Official Server');
    const [serverMessage,setServerMessage] = useState('');
    const [selectedCarClass,setSelectedCarClass] = useState(0);
    const [selectedCarClassName,setSelectedCarClassName] = useState('')
    const [selectedCar,setSelectedCar] = useState(0);
    const [selectedTrack,setSelectedTrack] = useState(0);
    const [botLevel,setBotLevel] = useState(85);

    function setupServer(e){
        console.log('Setup server with name:',serverName,'car:',selectedCar,'track:',selectedTrack,'sel:',selectedCarClass,selectedCarClassName);
        e.preventDefault();
        postAPIData(
            '/api/session/set_attributes',
            {
                //session_Name: serverName,
                session_VehicleClassId: selectedCarClass,
                session_VehicleModelId: selectedCar,
                session_TrackId: selectedTrack,
                session_OpponentDifficulty: botLevel
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
    return (
        <p>
            <h3>Basic Server Setup</h3>
            <form onSubmit={ setupServer }>
                <label>
                    Server Name:
                    <input disabled id='inpServerName' name='inpServerName' type='text' onInput={(e) => setServerName(e.target.value)} value={serverName}></input>
                </label>
                <br/>
                <label>
                    Car Classes:
                    <select onChange={e => {let spl = e.target.value.split(',');setSelectedCarClass(spl[0]); setSelectedCarClassName(spl[1]); }}>
                        {
                            carClasses.sort((a,b)=>a.name.localeCompare(b.name)).map((cls) => (
                                <option value={`${cls.value},${cls.name}`} id={cls.value} name={cls.name}>{cls.name}</option>
                            ))
                        }
                    </select>
                </label>
                <br/>
                <label>
                    Car Options:
                    <select onChange={e => setSelectedCar(e.target.value)} value={selectedCar}>
                        {
                            cars.filter(car => car.class === selectedCarClassName).sort((a,b)=>a.name.localeCompare(b.name)).map((car) => (
                                <option value={car.id} key={car.id}>{car.name} ({car.class})</option>
                            ))
                        }
                    </select>
                </label>
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
                            {console.log('arr:',([...Array(30).keys()].map(i=> (i + 70).toString())))}
                    <select onChange={e => setBotLevel(e.target.value)} value={botLevel}>
                        
                        {([...Array(31).keys()].map(i=> i + 70)).map((num) =>(
                            <option value={num} key={num}>{num.toString()}</option>
                        ))}
                    </select>
                </label>
                <br/>
                <button type='button' onClick={setupServer}>Set Server</button>
            </form>
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
                <button type='button' onClick={sendServerMessage}>Send</button>
            </label>
            <br/> <br/> <br/>
        </p>
    );
};
export default ServerSetupForm;