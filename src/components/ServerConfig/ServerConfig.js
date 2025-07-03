import React from "react";
import { useState, useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import ServerCurrentPlayerList from "./ServerCurrentPlayerList";
import ServerStats from "./ServerStats";
import ServerTroubleshooting from "./ServerTroubleshooting";
import postAPIData from "../../utils/postAPIData";
import getAPIData from "../../utils/getAPIData";
import ServerNamePassword from "./ServerNamePassword";

export default function ServerConfig({ lists }) {
  const [curPlayerList, setCurPlayerList] = useState([]);
  const [curConfig, setCurConfig] = useState({});

  async function refreshPlayerList() {
    setCurPlayerList([]);
    let status = await postAPIData(
      "/api/session/status",
      { members: true },
      true
    );
    setCurPlayerList(status?.members);
  }
  async function getCurrentConfig() {
    let res = await getAPIData("/config");
    if (res) setCurConfig({ ...res });
  }

  useEffect(() => {
    refreshPlayerList();
    getCurrentConfig();
  }, [lists]);
  return (
    <div>
      <Row>
        <ServerCurrentPlayerList
          players={curPlayerList}
          refreshPlayerList={refreshPlayerList}
        />
      </Row>
      <Row>
        <ServerStats lists={lists} />
      </Row>
      <Row>
        <Col>
          <ServerTroubleshooting />
        </Col>
        <Col>
          <ServerNamePassword config={curConfig} />
        </Col>
      </Row>
    </div>
  );
}
