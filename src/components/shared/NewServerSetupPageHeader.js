import React from 'react'
import logo from "../../assets/skidmark-placeholder.png";

export default function PageHeader({ title }) {
  return (
    <header className="py-2 bg-light border-bottom mb-4">
        <div className="container">
            <div className="text-center my-3">
                {
                  process.env.REACT_APP_ENV === "Skidmark Tour" ?
                  <div>
                    <img src={logo} alt="The Skidmarks" /> 
                    <br/><br/>    
                  </div>: <></>
                }
                {
                  title ?
                  <div>     
                    <h1 className="fw-bolder">{title}</h1>
                  </div> : <></>
                }
            </div>
        </div>
    </header>
  )
}
