import { useState, useEffect } from 'react';
import logo from './assets/skidmark-placeholder.png'
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import ServerSetupForm from './components/ServerSetup/ServerSetupForm';
import ServerStatus from './components/ServerSetup/ServerStatus';
import getAPIData from './utils/getAPIData';
import postAPIData from './utils/postAPIData';

const App = () => {
  const [cars,setCars] = useState([]);
  const [carClasses,setCarClasses] = useState([]);
  const [tracks,setTracks] = useState([]);
  const [formData,setFormData] = useState([]);
  const [apiData,setapiData] = useState([]);
  const [serverStatus,setServerStatus] = useState({});
  const [editableFields,setEditableFields] = useState([]);

  useEffect(() => {

    async function getServerStatus(){
      let status = await postAPIData('/api/session/status',{ attributes : true },true);
      console.log('status!!!!:',status);
      setServerStatus(status);
    }
    async function getEditableFields(){
      let fieldObject = await getAPIData('/api/list/attributes/session');
      setEditableFields(fieldObject.list)
    }
    async function getTracks(){
      let trackResponse = await getAPIData('/api/list/tracks');
      setTracks(trackResponse.list);
    }
    async function getCarClasses(){
      let carClassResponse = await getAPIData('/api/list/vehicle_classes');
      setCarClasses(carClassResponse.list);
    }
    async function getCars(){
      let carResponse = await getAPIData('/api/list/vehicles');
      //console.log('carRes:',carResponse,'carss:',cars)
      setCars(carResponse.list)
    } 

    getServerStatus();
    getEditableFields();
    getTracks();
    getCarClasses();
    getCars();
  },[])

  return ( 
    
      <div className="container">
        <img src={logo} alt='The Skidmarks'/>
        <Tabs defaultActiveKey="serverSetup" className='mb-3' id='tabs'>
          <Tab eventKey="home" title="Home">
            <>
                Home Under Construction
            </>
          </Tab>
          <Tab eventKey="requestForm" title="Race Requests">
            <>
                Race Request Form Under Construction
            </>
          </Tab>
          <Tab eventKey="results" title="Race Results">
            <>
                Race Results Under Construction
            </>
          </Tab>
          <Tab eventKey="serverSetup" title="Server Setup">
            <>  
            <div>
              <ServerSetupForm editableFields={editableFields} carClasses={carClasses} cars={cars} tracks={tracks}/>
              <ServerStatus serverStatus={serverStatus} />
            </div>
            </>
          </Tab>
          {/* <Tab eventKey="serverAPIDetails" title="Server API Options">
            <APIDetails methods={apiData} />
          </Tab> */}
        </Tabs>
        <footer>
          <p>  Skidmark Tour &copy; 2022</p>
          <small>You are running this application in {process.env.NODE_ENV} mode.</small>
        </footer>
      </div>
  );
}

export default App;
