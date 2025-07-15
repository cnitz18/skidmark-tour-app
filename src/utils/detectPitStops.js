  // Detect pit stops by analyzing lap time anomalies
  const detectPitStops = (eventsData, laps) => {
    const pitLaps = {
      in : [],
      out: []
    };
    for (let i = 1; i < laps.length; i++) {
      const currentLap = laps[i];
      const lapEvents = eventsData.filter(e => e.attributes_Lap === currentLap.attributes_Lap)
      const pittedIn = lapEvents.some(e => e.event_name === "State" && e.attributes_NewState === "EnteringPits");
      const pittedOut = lapEvents.some(e => e.event_name === "State" && e.attributes_NewState === "Racing");

      if ( lapEvents  ) {
        if( pittedIn ) pitLaps.in.push(currentLap.attributes_Lap);
        if( pittedOut ) pitLaps.out.push(currentLap.attributes_Lap);
      }
    }
    
    return pitLaps;
  };

  export default detectPitStops;