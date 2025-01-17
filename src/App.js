/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import getAPIData from "./utils/getAPIData";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
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
      // console.log("flagsResponse:", flagResponse);
      let curLists = {
        tracks: trackResponse,
        vehicle_classes: carClassResponse,
        vehicles: carResponse,
        flags: flagResponse,
      };
      console.log('setting lists:',curLists)
      setLists({ ...curLists });
    }

    getEnums();
    getLists();
  }, []);

  return (
    <>
      <NavBar enums={enums} lists={lists}/>
      <Footer/>
    </>

  );
};

export default App;
