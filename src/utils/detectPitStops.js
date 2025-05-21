  // Detect pit stops by analyzing lap time anomalies
  const detectPitStops = (eventsData, laps) => {
    const pitLaps = [];
    for (let i = 1; i < laps.length; i++) {
      const currentLap = laps[i];
      const lapEvents = eventsData.filter(e => e.attributes_Lap === currentLap.attributes_Lap)
      const pittedIn = lapEvents.some(e => e.event_name === "State" && e.attributes_NewState === "EnteringPits");
      const pittedOut = lapEvents.some(e => e.event_name === "State" && e.attributes_NewState === "ExitingPits");

      if ( lapEvents && (pittedIn || pittedOut) ) {
        pitLaps.push(currentLap.attributes_Lap);
      }
    }
    
    return pitLaps;
  };

  export default detectPitStops;