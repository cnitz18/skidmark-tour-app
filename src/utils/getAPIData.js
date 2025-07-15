
async function getAPIData(subpath) {
  try {
    function checkResponse(res) {
      if (!res.ok) {
        const message = `An error occurred when getting Dedicated Server data: ${res.statusText}`;
        console.error(message);
        return;
      }
    }
    let response = await fetch(process.env.REACT_APP_AMS2API + subpath, {
      referrerPolicy: "no-referrer",
      // headers: {Authorization: 'Token ' + process.env.REACT_APP_AUTH_TOKEN}
    });

    checkResponse(response);
    let jsonRes = await response.json();
    
    return jsonRes.response ?? jsonRes;
  } catch (err) {
    console.error("getAPIData error:", err);
    throw err;
  }
}
export default getAPIData;
