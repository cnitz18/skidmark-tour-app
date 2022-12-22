import postAPIData from "../postAPIData";
import ServerConfigHandler from "./ServerConfigHandler";
import AMS2API from "../AMS2API";

class WebServerCommands {
  static async savePreset(name, preset, fields) {
    try {
      //console.log('pres:',preset)
      let validatedData = ServerConfigHandler.trimExtraFields(preset, fields);
      validatedData.PresetName = name;
      //console.log('validated:',validatedData)
      let res = await postAPIData("/db/racepresets/add", validatedData);
      return { status: res.status, statusText: res.statusText };
    } catch (err) {
      console.error("Error in WebServerCommands.savePreset:" + err);
      return { status: 500, statusText: err.message };
    }
  }
  static async deletePreset(id) {
    try {
      //console.log("delete:", id);
      let res = await fetch(AMS2API + "/db/racepresets/" + id, {
        method: "DELETE",
      });
      return { status: res.status, statusText: res.statusText };
    } catch (err) {
      console.error("Error in WebServerCommands.deletePreset:" + err);
      return { status: 500, statusText: err.message };
    }
  }
}
export default WebServerCommands;
