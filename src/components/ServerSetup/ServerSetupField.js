const Enums = require('../../utils/VariableTypes/Enums');
const EnumToListName = require('../../utils/EnumToListName')
const ServerSetupField = ({ attr, field, setField, enums }) => {
    function isEnumField( f ){
       // console.log('Enums:',Enums.default);
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
        if( field.includes('Weather') )
            f = "Weather";
        else if( field.includes('LiveTrackPreset') )
            f = 'LiveTrackPreset'
       // console.log('enums:',enums);
        return EnumToListName.default[f];
    }
    function getEnumList( f ){
        let name = enumListName(f);
        if( enums[name] )
            return enums[name].list
        return [];
    }
    return (
        <div>

            <label>
                {readableName(field)}:
                {
                    isEnumField(field) ?
                    <select onChange={e => setField(e.target.value)} value={field}>
                        {getEnumList(field).map((e) => (
                            <option value={e.value} key={e.value}>{e.name}</option>
                        ))}
                    </select>
                    :
                    <p>Normal Field</p>
                }
                {/* <select onChange={e => setField(e.target.value) } value={field}>
                    {enums['pit_control'].list.map(e => (
                        <option value={e.value} key={e.value}>{e.name}</option>
                        ))}
                    </select> */}
            </label>
        </div>
    );
}
export default ServerSetupField;