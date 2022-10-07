import React from "react";
import { Button } from "react-bootstrap";

export default function ServerSetupStatus({ serverState }) {
  return (
    <div className="setup">
      <span>Current Status: </span>
      {serverState === "Running" ? (
        <Button variant="outline-success" disabled>
          Running
        </Button>
      ) : serverState === "Idle" ? (
        <Button variant="outline-warning" disabled>
          Idle
        </Button>
      ) : (
        <Button variant="outline-danger" disabled>
          Server Status Unexpected!
        </Button>
      )}
    </div>
  );
}
