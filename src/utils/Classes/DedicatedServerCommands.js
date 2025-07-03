import getAPIData from "../getAPIData";
import postAPIData from "../postAPIData";
import ServerConfigHandler from "./ServerConfigHandler";
// eslint-disable-next-line no-useless-escape
const SPECIAL_CHAR_REGEX = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g;

class DedicatedServerCommands {
  static async setDedicatedServerState(setupData, fieldList) {
    try {
      let validatedData = ServerConfigHandler.trimExtraFields(
        setupData,
        fieldList
      );
      if (
        validatedData.session_OpponentDifficulty > 100 ||
        validatedData.session_OpponentDifficulty < 0
      )
        return {
          status: 400,
          statusText: "Opponent Difficulty must be between 70-120",
        };
      let res = await postAPIData("/api/session/set_attributes", validatedData);
      return { status: res.status, statusText: res.statusText };
    } catch (err) {
      console.error("Error in setServerState:" + err);
      return { status: 500, statusText: err.message };
    }
  }
  static async softRestartServer() {
    try {
      await getAPIData("/api/restart");
      return { status: 200, statusText: "I think this worked?" };
    } catch (err) {
      console.error("Error in softRestartServer:" + err);
      return { status: 500, statusText: err.message };
    }
  }
  static async updateSessionConfig(cfgObject) {
    try {
      let validatedData = {
        name: cfgObject.name.replace(SPECIAL_CHAR_REGEX, ""),
        pwd: cfgObject.pwd,
      };

      if (validatedData.pwd === undefined || !validatedData.name)
        throw new Error(
          "Non-empty <name> and non-null <pwd> properties expected"
        );
      let res = await postAPIData("/config", validatedData);
      return { status: res.status, statusText: res.statusText };
    } catch (err) {
      console.error("Error in updateSessionConfig:" + err);
      return { status: 500, statusText: err.message };
    }
  }
}
export default DedicatedServerCommands;
