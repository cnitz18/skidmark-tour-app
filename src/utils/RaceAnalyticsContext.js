import { createContext, useState, useEffect, useContext } from 'react';
import detectPitStops from './detectPitStops';

const RaceAnalyticsContext = createContext();

export const RaceAnalyticsProvider = ({ children, raceData, eventsData }) => {
  const [driverAnalytics, setDriverAnalytics] = useState({});

  const calculateMedianLapTime = (laps) => {
    if (laps.length === 0) return 0;
    
    const lapTimes = laps.map(lap => lap.attributes_LapTime).sort((a, b) => a - b);
    const mid = Math.floor(lapTimes.length / 2);
    
    return lapTimes.length % 2 === 0
      ? (lapTimes[mid - 1] + lapTimes[mid]) / 2
      : lapTimes[mid];
  };

  useEffect(() => {
    if (raceData && raceData.results) {
      const analytics = {};
      // Process all drivers
      raceData.results.forEach(driver => {
        const driverEvents = eventsData.find(evt => evt[0].participantid === driver.participantid);
        if (driverEvents) {
          // Extract lap events
          const lapEvents = driverEvents.filter(evt => evt.event_name === "Lap");
          console.log('Lap Events:', lapEvents);
          const pitLaps = detectPitStops(driverEvents, lapEvents);
          
          // Calculate lap times
          const avgLapTimeFullRace = lapEvents.reduce((sum, lap) => sum + lap.attributes_LapTime, 0) / lapEvents.length;
          const lapTimes = lapEvents.filter((lap) => pitLaps.indexOf(lap.attributes_Lap) === -1 ).map(lap => lap.attributes_LapTime);
          const spread = Math.max(...lapTimes) - Math.min(...lapTimes);
          const avgLapTime = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
          const bestLapTime = Math.min(...lapTimes);

          // Calculate sector times
          const sector1Times = lapEvents.map(lap => lap.attributes_Sector1Time);
          const sector2Times = lapEvents.map(lap => lap.attributes_Sector2Time);
          const sector3Times = lapEvents.map(lap => lap.attributes_Sector3Time);
          const avgSector1Time = sector1Times.reduce((sum, time) => sum + time, 0) / sector1Times.length;
          const avgSector2Time = sector2Times.reduce((sum, time) => sum + time, 0) / sector2Times.length;
          const avgSector3Time = sector3Times.reduce((sum, time) => sum + time, 0) / sector3Times.length;
          // const vsAverageS1 = ;

          var calculateStandardDeviation = (lapOrSectorTimes,avgLapOrSectorTime) => {
            const squaredDiffs = lapOrSectorTimes.map(time => Math.pow(time - avgLapOrSectorTime, 2));
            const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length;

            // Calculate standard deviation for consistency
            const stdDev = Math.sqrt(avgSquaredDiff);

            // Calculate coefficient of variation (normalized standard deviation)
            const cv = stdDev / avgLapTime;

            // Get consistency score using best scaling factor (100 instead of 2000)
            const consistency = (10 - Math.min(10, cv * 100)).toFixed(1); // Convert CV to a 0-10 scale

            return [stdDev, cv, consistency];
          }

          const [stdDev,cv,consistency] = calculateStandardDeviation(lapTimes,avgLapTime);
          const consistencyS1 = calculateStandardDeviation(sector1Times,avgSector1Time)[2];
          const consistencyS2 = calculateStandardDeviation(sector2Times,avgSector2Time)[2];
          const consistencyS3 = calculateStandardDeviation(sector3Times,avgSector3Time)[2];

          analytics[driver.participantid] = {
            avgLapTimeFullRace,
            bestLapTime,
            avgLapTime,
            min: Math.min(...lapTimes),
            max: Math.max(...lapTimes),
            avg: avgLapTime,
            median: calculateMedianLapTime(lapEvents),
            stdDev,
            cv,
            range: Math.max(...lapTimes) - Math.min(...lapTimes),
            consistency,
            consistencyS1,
            avgSector1Time,
            consistencyS2,
            avgSector2Time,
            consistencyS3,
            avgSector3Time,
            spread,
          };
          //  = metrics;
        }
      });

      // Calculate field comparison values
      const fieldConsistencyAvg = Object.values(analytics).reduce((sum, val) => sum + parseFloat(val.consistency), 0) / Object.values(analytics).length;
      for( const participantid in analytics) {
        var d = analytics[participantid]  // Consistency vs Field avg
        // console.log('Field Consistency Avg:', fieldConsistencyAvg);
        var meVsField = parseFloat(d.consistency) / fieldConsistencyAvg;
        // console.log('Me vs Field:', meVsField);
        var fieldComparison = (meVsField - 1) * 100;
        // console.log('Field Comparison:', fieldComparison,'for participant:', d.participantid);
        analytics[participantid].fieldComparison = fieldComparison;
      }
      Object.values(analytics).forEach(d => {

      })

      setDriverAnalytics(analytics);
    }
  }, [raceData, eventsData]);

  return (
    <RaceAnalyticsContext.Provider value={{ driverAnalytics }}>
      {children}
    </RaceAnalyticsContext.Provider>
  );
};

export const useRaceAnalytics = () => useContext(RaceAnalyticsContext);

export default RaceAnalyticsContext;