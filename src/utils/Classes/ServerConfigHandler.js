class ServerConfigHandler {
  static trimExtraFields(config, fieldList) {
    let validatedData = { ...config };
    for (let key in validatedData) {
      let trimmedKey = key;
      if (key.indexOf("_") !== -1) trimmedKey = key.split("_")[1];
      if (fieldList.indexOf(trimmedKey) === -1) {
        delete validatedData[key];
      }
    }
    return validatedData;
  }
}
export default ServerConfigHandler;
