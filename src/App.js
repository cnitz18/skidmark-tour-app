import { useState, useEffect } from 'react';
import logo from './assets/skidmark-placeholder.png'
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import ServerSetupForm from './components/ServerSetup/ServerSetupForm';
import getAPIData from './utils/getAPIData';
import postAPIData from './utils/postAPIData';

const App = () => {
  const [cars,setCars] = useState([]);
  const [carClasses,setCarClasses] = useState([]);
  const [tracks,setTracks] = useState([]);
  const [formData,setFormData] = useState([]);
  const [apiData,setapiData] = useState([]);
  const [editableFields,setEditableFields] = useState([]);
  const [flags,setFlags] = useState([]);
  const [enums,setEnums] = useState({});
  const [lists,setLists] = useState({});

  useEffect(() => {
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
    async function getFlags(){
      let flagResponse = await getAPIData('/api/list/flags');
      setFlags(flagResponse.list);
    }
    async function getEnums(){
      let enumResponse = await getAPIData('/api/list/enums');
      //console.log('enumsssss:',enumResponse)
      setEnums({ ... enumResponse });
      //console.log('enumss??',enums)
    }
    async function getLists(){
      let trackResponse = await getAPIData('/api/list/tracks');      
      let carClassResponse = await getAPIData('/api/list/vehicle_classes');
      let carResponse = await getAPIData('/api/list/vehicles');
      let flagResponse = await getAPIData('/api/list/flags');
      let curLists = {
        tracks: trackResponse,
        vehicle_classes: carClassResponse,
        vehicles: carResponse,
        flags: flagResponse
      }
      setLists({...curLists});
      //console.log('curLists:',curLists)
    }

    getEditableFields();
    getTracks();
    getCarClasses();
    getCars();
    getFlags();
    getEnums();
    getLists();
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
              <ServerSetupForm enums={enums} lists={lists}/>
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
