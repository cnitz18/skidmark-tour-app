
async function getAPIData(subpath) {
  //console.log('getAPIData',process.env.REACT_APP_AMS2API + subpath);
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
    let response = await fetch(process.env.REACT_APP_AMS2API + subpath, {
      referrerPolicy: "no-referrer",
      headers: {Authorization: 'Token ' + process.env.REACT_APP_AUTH_TOKEN}
    });
    //let response = await fetch(process.env.REACT_APP_AMS2API + subpath);
    checkResponse(response);
    //console.log('setting response json',response.body)
    let jsonRes = await response.json();
    //console.log('jsonres:',subpath,jsonRes)
    return jsonRes.response ?? jsonRes;
  } catch (err) {
    console.error("getAPIData error:", err);
    throw err;
  }
}
export default getAPIData;
