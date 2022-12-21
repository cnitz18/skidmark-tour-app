function ConvertInputType(field) {
  let fieldName = field.name;
  switch (fieldName) {
    case "DamageType":
    case "TireWearType":
    case "FuelUsageType":
    case "PenaltiesType":
    case "AllowedViews":
    case "GridLayout":
    case "PitControl":
    case "LiveTrackPreset": //how do i include this in lookups?
    case "Weather":
      return "enum";
    case "TrackId":
    case "VehicleClassId":
      return "list";
    case "ServerControlsSetup":
    case "ServerControlsTrack":
    case "ServerControlsVehicleClass":
    case "ServerControlsVehicle":
    case "PitWhiteLinePenalty":
    case "DriveThroughPenalty":
    case "ManualPitStops":
    case "ManualRollingStarts":
    case "RaceExtraLap":
    case "RaceRollingStart":
    case "RaceMandatoryPitStops":
    case "RaceFormationLap":
    case "DisablePitstopRefuelling":
    case "FullCourseYellows":
    case "DamageRandomFailures":
      return "boolean";
    case "Latitude":
    case "Longitude":
    case "Altitude":
    case "PracticeLength":
    case "PracticeDateHour":
    case "QualifyLength":
    case "QualifyDateHour":
    case "RaceLength":
    case "RaceDateYear":
    case "RaceDateMonth":
    case "RaceDateDay":
    case "RaceDateHour":
      return "number";
    case "SessionState":
    case "SessionStage":
    case "SessionPhase":
      return "string";
    case "Flags":
      return "flags";
    case "OpponentDifficulty":
      return "opponentdifficulty";
    case "GridSize":
    case "MaxPlayers":
    case "DamageScale":
    case "AllowedCutsBeforePenalty":
    case "PracticeWeatherSlots":
    case "QualifyWeatherSlots":
    case "RaceWeatherSlots":
    case "MultiClassSlots":
      return "number";
    default:
      if (fieldName) {
        //console.log('fieldName:',fieldName)
        if (
          fieldName.includes("WeatherSlot") ||
          fieldName.includes("LiveTrackPreset")
        )
          //if is a weather field but doesn't define the number of slots
          return "enum";
        if (fieldName.includes("MultiClassSlot")) return "list";
      }
      return "none";
  }
}
export default ConvertInputType;
