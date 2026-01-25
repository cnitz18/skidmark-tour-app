/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import getAPIData from "./utils/getAPIData";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import { ThemeProvider } from "./contexts/ThemeContext";
import './index.css';

const App = () => {
  const [enums, setEnums] = useState({});
  const [lists, setLists] = useState({});

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
    <ThemeProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavBar enums={enums} lists={lists}/>
        <main style={{ flex: 1 }}></main>
        <Footer/>
      </div>
    </ThemeProvider>
  );
};

export default App;
