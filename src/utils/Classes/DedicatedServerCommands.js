import postAPIData from "../postAPIData";
import ServerConfigHandler from "./ServerConfigHandler";

class DedicatedServerCommands {
  static async setDedicatedServerState(setupData, fieldList) {
    try {
      let validatedData = ServerConfigHandler.trimExtraFields(
        setupData,
        fieldList
      );
      //console.log("validatedData:", validatedData);
      if (
        validatedData.session_OpponentDifficulty > 100 ||
        validatedData.session_OpponentDifficulty < 0
      )
        return {
          status: 400,
          statusText: "Opponent Difficulty must be between 70-120",
        };
      let res = await postAPIData("/api/session/set_attributes", validatedData);
      // console.log('setDedicatedServerState done!',res);
      return { status: res.status, statusText: res.statusText };
    } catch (err) {
      console.error("Error in setServerState:" + err);
      return { status: 500, statusText: err.message };
    }
  }
}
export default DedicatedServerCommands;
