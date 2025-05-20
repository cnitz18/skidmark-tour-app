import getAPIData from "./getAPIData";
async function getStandardizedEventData(stage_id, participant_id) {
    const data = await getAPIData(`/api/batchupload/sms_stats_data/events/?stage_id=${stage_id}&participant_id=${participant_id}`);
    const needsCorrection = data.find(evt => evt.event_name === "Lap").attributes_Lap === 0;
    return data.map(evt => {
        if( needsCorrection && evt.event_name === "Lap" ) {
            return {
                ...evt,
                attributes_Lap: evt.attributes_Lap + 1
            }
        }
        return evt;
    })
}
export default getStandardizedEventData;