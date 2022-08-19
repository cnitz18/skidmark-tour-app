import { useState, useEffect } from 'react';
import logo from './assets/skidmark-placeholder.png'
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import ServerSetupForm from './components/ServerSetup/ServerSetupForm';
import getAPIData from './utils/getAPIData';

const App = () => {
  const [enums,setEnums] = useState({});
  const [lists,setLists] = useState({});

  useEffect(() => {
    async function getEnums(){
      let enumResponse = await getAPIData('/api/list/enums');
      setEnums({ ...enumResponse });
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
      setLists({ ...curLists});
    }

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
        </Tabs>
        <footer>
          <p>  Skidmark Tour &copy; 2022</p>
          <small>You are running this application in {process.env.NODE_ENV} mode.</small>
        </footer>
      </div>
  );
}

export default App;
