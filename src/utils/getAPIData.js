import AMS2API from "./AMS2API";

async function getAPIData(subpath) {
  //console.log('getAPIData api path:',AMS2API + subpath);
  try {
    function checkResponse(res) {
      //console.log('checkResponse:',res)
      if (!res.ok) {
        //console.error(res);
        const message = `An error occurred when getting Dedicated Server data: ${res.statusText}`;
        console.error(message);
        return;
      }
    }
    let response = await fetch(AMS2API + subpath, {
      referrerPolicy: "no-referrer",
    });
    //let response = await fetch(AMS2API + subpath);
    checkResponse(response);
    let jsonRes = await response.json();
    //console.log('jsonres:',subpath,jsonRes)
    return jsonRes.response ?? jsonRes;
  } catch (err) {
    console.error("getAPIData error:", err);
    throw err;
  }
}
export default getAPIData;
