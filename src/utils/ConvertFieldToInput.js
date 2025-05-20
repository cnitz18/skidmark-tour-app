const Enums = require("./VariableTypes/Enums");
const EnumToListName = require("./EnumToListName");
const ListTypeToListName = require("./ListTypeToListName");
const ConvertInputType = require("./VariableTypes/ConvertInputType").default;
function isEnumField(f) {
  if (Enums.default.includes(f)) return true;
  else if (f.includes("WeatherSlot") && !f.includes("WeatherSlots"))
    //if is a weather field but doesn't define the number of slots
    return true;
  else if (f.includes("LiveTrackPreset")) return true;
  return false;
}
function readableName(str) {
  return str.replace(/[A-Z]/g, " $&").trim();
}
function enumListName(f) {
  if (f.includes("Weather")) f = "Weather";
  else if (f.includes("LiveTrackPreset")) f = "LiveTrackPreset";
  return EnumToListName.default[f];
}
function listTypeListName(f) {
  return ListTypeToListName.default[f];
}

// Intakes a field name and value, converts it if need be and outputs an object { field: '', value: '', type: ''}
function ConvertFieldToInput(field, curState) {
  let curField = { ...field };
  curField.disabled = field.access === "ReadOnly";
  curField.isEnum = isEnumField(field.name);
  curField.state = curState[field.name];
  if (curField.isEnum) curField.enumListName = enumListName(field.name);
  curField.readableName = readableName(field.name);
  curField.inputType = ConvertInputType(field);
  if (curField.inputType === "list" || curField.inputType === "flags")
    curField.typeListName = listTypeListName(field.name);
  if (curField.name === "OpponentDifficulty")
    curField.description =
      "Difficulty of AI participants. Valid Values in range 70-120";
  if (curField.inputType === "slider") {
    switch (curField.name) {
      case "GridSize":
      case "MaxPlayers":
        curField.min = 1;
        curField.max = 32;
        break;
      case "DamageScale":
        curField.min = 0;
        curField.max = 4;
        break;
      case "AllowedCutsBeforePenalty":
        curField.min = 0;
        curField.max = 50;
        break;
      case "PracticeWeatherSlots":
      case "QualifyWeatherSlots":
      case "RaceWeatherSlots":
        curField.min = 0;
        curField.max = 4;
        break;
      case "MultiClassSlots":
        curField.min = 0;
        curField.max = 9;
        break;
      default:
        curField.min = -100;
        curField.max = 100;
    }
  }
  return curField;
}
export default ConvertFieldToInput;
