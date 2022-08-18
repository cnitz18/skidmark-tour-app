const Enums = require('./VariableTypes/Enums');
const EnumToListName = require('./EnumToListName');
const ListTypeToListName = require('./ListTypeToListName')
const ConvertInputType = require('./VariableTypes/ConvertInputType').default;
function isEnumField( f ){
    //console.log('Enums:',Enums.default);
    if( Enums.default.includes(f) )
        return true;
    else if( f.includes('WeatherSlot') && !f.includes('WeatherSlots') ) //if is a weather field but doesn't define the number of slots
        return true;
    else if( f.includes('LiveTrackPreset') ) 
        return true;
    return false;
}
function readableName( str ){
    return str.replace(/[A-Z]/g, ' $&').trim();
}
function enumListName( f ){
    if( f.includes('Weather') )
        f = "Weather";
    else if( f.includes('LiveTrackPreset') )
        f = 'LiveTrackPreset'
   // console.log('enums:',enums);
    return EnumToListName.default[f];
}
function listTypeListName( f ){
    return ListTypeToListName.default[f];
}
// function getEnumList( f ){
//     let name = enumListName(f);
//     if( enums[name] )
//         return enums[name].list
//     return [];
// }
// Intakes a field name and value, converts it if need be and outputs an object { field: '', value: '', type: ''}
function ConvertFieldToInput( field, curState ){
    let curField = { ...field };
    curField.disabled = field.access === 'ReadOnly';
    curField.isEnum = isEnumField(field.name);
    curField.state = curState[field.name];
    if( curField.isEnum )
        curField.enumListName = enumListName(field.name);
    curField.readableName = readableName(field.name);
    curField.inputType = ConvertInputType(field);
    if( curField.inputType === 'list' )
        curField.typeListName = listTypeListName(field.name);
    //console.log('converted:',curField);
    return curField;
}
export default ConvertFieldToInput;