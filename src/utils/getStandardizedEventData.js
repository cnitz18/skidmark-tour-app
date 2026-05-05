import getAPIData from "./getAPIData";
async function getStandardizedEventData(stage_id, participant_id) {
    try {
        const data = await getAPIData(`/api/batchupload/sms_stats_data/events/?stage_id=${stage_id}&participant_id=${participant_id}`);
        if (!Array.isArray(data) || data.length === 0) {
            return [];
        }

        const firstLapEvent = data.find((evt) => evt?.event_name === "Lap");
        const needsCorrection = firstLapEvent?.attributes_Lap === 0;

        if (!needsCorrection) {
            return data;
        }

        let currentLapAtEventTime = 1;
        return data.map((evt) => {
            if (evt?.event_name === "Lap") {
                return {
                    ...evt,
                    attributes_Lap: currentLapAtEventTime++,
                };
            }

            return {
                ...evt,
                attributes_Lap: currentLapAtEventTime,
            };
        });
    } catch (err) {
        console.error("getStandardizedEventData error:", err);
        return [];
    }
}
export default getStandardizedEventData;