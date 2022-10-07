class ServerConfigHandler {
  static trimExtraFields(config, fieldList) {
    let validatedData = { ...config };
    for (let key in validatedData) {
      //console.log('key:',key.split('_')[1])
      if (fieldList.indexOf(key.split("_")[1]) === -1) {
        //console.log("Trimming unexpected field in setServerState(): " + key);
        delete validatedData[key];
      }
    }
    return validatedData;
  }
}
export default ServerConfigHandler;
