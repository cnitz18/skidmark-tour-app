import React from 'react'
import logo from "../../assets/skidmark-placeholder.png";

export default function NewServerSetupPageHeader() {
  return (
    <header className="py-2 bg-light border-bottom mb-4">
        <div className="container">
            <div className="text-center my-3">
                <img src={logo} alt="The Skidmarks" />
                <br/><br/>          
                <h1 className="fw-bolder">Server Setup Page</h1>
            </div>
        </div>
    </header>
  )
}
