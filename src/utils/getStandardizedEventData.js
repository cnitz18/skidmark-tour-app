import getAPIData from "./getAPIData";
async function getStandardizedEventData(stage_id, participant_id) {
    const data = await getAPIData(`/api/batchupload/sms_stats_data/events/?stage_id=${stage_id}&participant_id=${participant_id}`);
    const needsCorrection = data.find(evt => evt.event_name === "Lap").attributes_Lap === 0;
    let currentLapAtEventTime = 1;
    if( needsCorrection ){
        return data.map(evt => {
            if( evt.event_name === "Lap" ) {
                return {
                    ...evt,
                    attributes_Lap: currentLapAtEventTime++
                }
            }
            return {
                ...evt,
                attributes_Lap: currentLapAtEventTime
            }
        })
    }
}
export default getStandardizedEventData;