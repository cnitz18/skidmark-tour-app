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
      
      // First pass: Calculate individual driver stats and find best sector times
      let sessionBestS1Time = Infinity;
      let sessionBestS2Time = Infinity;
      let sessionBestS3Time = Infinity;
      
      raceData.results.forEach(driver => {
        const driverEvents = eventsData.find(evt => evt[0].participantid === driver.participantid);
        if (driverEvents) {
          // Extract lap events, don't include first lap or pit laps
          const allLapEvents = driverEvents.filter(evt => evt.event_name === "Lap");
          var lapEvents = allLapEvents.filter((evt,i) => i !== 0);
          const pitLaps = detectPitStops(driverEvents, lapEvents);
          lapEvents = lapEvents.filter((lap) => pitLaps.indexOf(lap.attributes_Lap) === -1 );
          
          // Calculate lap times
          const avgLapTimeFullRace = allLapEvents.reduce((sum, lap) => sum + lap.attributes_LapTime, 0) / allLapEvents.length;
          const lapTimes = lapEvents.map(lap => lap.attributes_LapTime);
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
          
          // Calculate best sector times for this driver
          const bestSector1Time = Math.min(...sector1Times);
          const bestSector2Time = Math.min(...sector2Times);
          const bestSector3Time = Math.min(...sector3Times);
          
          // Update session bests if needed
          sessionBestS1Time = Math.min(sessionBestS1Time, bestSector1Time);
          sessionBestS2Time = Math.min(sessionBestS2Time, bestSector2Time);
          sessionBestS3Time = Math.min(sessionBestS3Time, bestSector3Time);

          var calculateStandardDeviation = (lapOrSectorTimes, avgLapOrSectorTime,print=false) => {
            const squaredDiffs = lapOrSectorTimes.map(time => Math.pow(time - avgLapOrSectorTime, 2));
            const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length;

            // Calculate standard deviation for consistency
            const stdDev = Math.sqrt(avgSquaredDiff);

            // Calculate coefficient of variation (normalized standard deviation)
            const cv = stdDev / avgLapTime;

            // Get consistency score using best scaling factor (100 instead of 2000)
            const consistency = (10 - Math.min(10, cv * 100)).toFixed(1); // Convert CV to a 0-10 scale
            if(print){
              console.log("Lap/Sector Times: ", lapOrSectorTimes);
              console.log("Avg Lap/Sector Time: ", avgLapOrSectorTime);
              console.log("Standard Deviation: ", stdDev);
              console.log("Coefficient of Variation: ", cv);
              console.log("Consistency: ", consistency);
            }
            return [stdDev, cv, consistency];
          }

          const [stdDev,cv,consistency] = calculateStandardDeviation(lapTimes,avgLapTime);
          const consistencyS1 = calculateStandardDeviation(sector1Times,avgSector1Time,true)[2];
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
            bestSector1Time,
            consistencyS2,
            avgSector2Time,
            bestSector2Time,
            consistencyS3,
            avgSector3Time,
            bestSector3Time,
            spread,
          };
        }
      });
      
      // Second pass: Calculate gaps to session bests
      for (const participantid in analytics) {
        const driver = analytics[participantid];
        
        // Calculate gaps to session best
        driver.gapToSessionBestS1 = driver.bestSector1Time - sessionBestS1Time;
        driver.gapToSessionBestS2 = driver.bestSector2Time - sessionBestS2Time;
        driver.gapToSessionBestS3 = driver.bestSector3Time - sessionBestS3Time;
        
        // Store session best times for reference
        driver.sessionBestS1Time = sessionBestS1Time;
        driver.sessionBestS2Time = sessionBestS2Time;
        driver.sessionBestS3Time = sessionBestS3Time;
        
        // Is this driver the holder of any session best sectors?
        driver.hasSessionBestS1 = driver.bestSector1Time === sessionBestS1Time;
        driver.hasSessionBestS2 = driver.bestSector2Time === sessionBestS2Time;
        driver.hasSessionBestS3 = driver.bestSector3Time === sessionBestS3Time;
      }

      // Calculate field comparison values
      const fieldConsistencyAvg = Object.values(analytics).reduce((sum, val) => sum + parseFloat(val.consistency), 0) / Object.values(analytics).length;
      for (const participantid in analytics) {
        var d = analytics[participantid];  // Consistency vs Field avg
        var meVsField = parseFloat(d.consistency) / fieldConsistencyAvg;
        var fieldComparison = (meVsField - 1) * 100;
        analytics[participantid].fieldComparison = fieldComparison;
      }
      console.log('analytics', analytics);
      
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