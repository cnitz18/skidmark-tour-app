async function postAPIData(subpath, options, convertToJson = false) {
  //console.log('postAPIData api path:',process.env.REACT_APP_AMS2API + subpath);
  function checkResponse(res) {
    // console.log('postAPIData res:',res);
    if (!res.ok) {
      const message = `An error occurred when posting Dedicated Server data: ${res.statusText}`;
      window.alert(message);
      return;
    }
  }
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(options),
  };
  console.log('fetching...')
  console.log(process.env.REACT_APP_AMS2API + subpath, requestOptions)
  let response = await fetch(process.env.REACT_APP_AMS2API + subpath, requestOptions);
  checkResponse(response);
  if (convertToJson) {
    let json = await response.json();
    return json.response;
  }
  return response;
}
export default postAPIData;
