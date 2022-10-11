class ServerConfigHandler {
  static trimExtraFields(config, fieldList) {
    let validatedData = { ...config };
    for (let key in validatedData) {
      //console.log('key:',key.split('_')[1]);
      let trimmedKey = key;
      if (key.indexOf("_") !== -1) trimmedKey = key.split("_")[1];
      if (fieldList.indexOf(trimmedKey) === -1) {
        //console.log("Trimming unexpected field in setServerState(): " + key);
        delete validatedData[key];
      }
    }
    return validatedData;
  }
}
export default ServerConfigHandler;
