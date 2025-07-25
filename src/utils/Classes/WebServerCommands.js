import postAPIData from "../postAPIData";
import ServerConfigHandler from "./ServerConfigHandler";

class WebServerCommands {
  static async savePreset(name, preset, fields) {
    try {
      let validatedData = ServerConfigHandler.trimExtraFields(preset, fields);
      validatedData.PresetName = name;
      let res = await postAPIData("/db/racepresets/add", validatedData);
      return { status: res.status, statusText: res.statusText };
    } catch (err) {
      console.error("Error in WebServerCommands.savePreset:" + err);
      return { status: 500, statusText: err.message };
    }
  }
  static async deletePreset(id) {
    try {
      let res = await fetch(process.env.REACT_APP_AMS2API + "/db/racepresets/" + id, {
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
