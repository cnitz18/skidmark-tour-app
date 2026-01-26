import React from "react";
import "bootstrap/dist/css/bootstrap.css";
import "react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css";
import "./css/styles.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

import { createRoot } from 'react-dom/client'
const container = document.getElementById("root")
const root = createRoot(container);

document.title = "The " + (process.env.REACT_APP_ENV ?? "Skidmark Tour");
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
