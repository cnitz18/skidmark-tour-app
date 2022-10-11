import { useState, useEffect } from "react";
import logo from "./assets/skidmark-placeholder.png";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import ServerSetupForm from "./components/ServerSetup/ServerSetupForm";
import getAPIData from "./utils/getAPIData";
import SessionHistory from "./components/SessionHistory/SessionHistory";
import PlayerStats from "./components/PlayerStats/PlayerStats";
import ServerStats from "./components/ServerConfig/ServerStats";
import WeeklyPolls from "./components/WeeklyPolls/WeeklyPolls";
import ServerConfig from "./components/ServerConfig/ServerConfig";

const App = () => {
  const [enums, setEnums] = useState({});
  const [lists, setLists] = useState({});
  const [tabKey, setTabKey] = useState("serverSetup");

  function navigateToTab(tabName) {
    setTabKey(tabName);
  }

  useEffect(() => {
    async function getEnums() {
      let enumResponse = await getAPIData("/api/list/enums");
      setEnums({ ...enumResponse });
    }
    async function getLists() {
      let trackResponse = await getAPIData("/api/list/tracks");
      let carClassResponse = await getAPIData("/api/list/vehicle_classes");
      let carResponse = await getAPIData("/api/list/vehicles");
      let flagResponse = await getAPIData("/api/list/flags");
      //console.log("flagsResponse:", flagResponse);
      let curLists = {
        tracks: trackResponse,
        vehicle_classes: carClassResponse,
        vehicles: carResponse,
        flags: flagResponse,
      };
      setLists({ ...curLists });
    }

    getEnums();
    getLists();
  }, []);

  return (
    <div className="app-container">
      <img src={logo} alt="The Skidmarks" />
      <Tabs
        defaultActiveKey="serverSetup"
        className="mb-3"
        activeKey={tabKey}
        onSelect={(k) => setTabKey(k)}
        id="tabs"
      >
        <Tab eventKey="home" title="Home">
          <>
            Welcome! This website is under construction, see our progress in the
            tabs above!
          </>
        </Tab>
        <Tab eventKey="requestForm" title="Weekly Polls">
          <>
            <WeeklyPolls lists={lists} navigateToTab={navigateToTab} />
          </>
        </Tab>
        <Tab eventKey="history" title="Race History">
          <>
            <SessionHistory enums={enums} lists={lists} />
          </>
        </Tab>
        <Tab eventKey="serverSetup" title="Race Setup">
          <>
            <div>
              <ServerSetupForm enums={enums} lists={lists} />
            </div>
          </>
        </Tab>
        <Tab eventKey="playerStats" title="Player Statistics">
          <>
            <PlayerStats lists={lists} />
          </>
        </Tab>
        <Tab eventKey="serverStats" title="Server Configuration">
          <>
            <ServerConfig lists={lists} />
          </>
        </Tab>
      </Tabs>
      <footer>
        <p> Skidmark Tour &copy; 2022</p>
        <small>
          You are running this application in {process.env.NODE_ENV} mode.
        </small>
      </footer>
    </div>
  );
};

export default App;
