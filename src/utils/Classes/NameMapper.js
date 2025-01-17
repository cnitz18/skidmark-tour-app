class NameMapper {
    static fromTrackId( trackId, tracklist ) {
        return tracklist?.find((t) => t.id === trackId)?.name;
        // switch(trackId){
        //     default:
        //         let defaultName = tracklist?.find((t) => t.id === trackId)?.name
        //         if( !defaultName ) return "<undefined>";
        //         return defaultName.split('_').map((seg) => {
        //             switch( seg ){
        //                 case 'GP':
        //                 case 'OVAL':
        //                 case 'RX':
        //                 case 'SCC':
        //                 case 'SHORT':
        //                 case 'SCB':
        //                     return seg;
        //                 case 'NC':
        //                     return 'No Chicane';
        //                 case 'RC':
        //                     return 'Road Course';
        //                 case 'NATL':
        //                 case 'Nat':
        //                     return 'National';
        //                 default:
        //                     return seg?.replace(/([A-Z])/g, ' $1').trim()
        //             }
        //         }).join(' ');
        // }
    }
    static fromVehicleId( vehicleId, vehicleList ){
        return vehicleList?.find((v) => v.id === vehicleId)?.name ?? "N/A";
    }
    static fromVehicleClassId( vehicleClassId, classList, customMessage = "<undefined>" ){
        return classList?.find((v) => v.value === vehicleClassId)?.name ?? customMessage;
        // .replaceAll('Cat','Caterham')
        // .replaceAll('F-','Formula ')
        // .replaceAll('_',' ');
        // switch(mappedName){
        //     case "GT1":
        //     case "GT3":
        //     case "GT3 Gen2":
        //     case "GT4":
        //     case "GT5":
        //     case "LMDh":
        //     case "RX":
        //     case "DPI":
        //     case "TSICup":
        //         return mappedName;
        //     case "GTOpen":
        //         return "GT Open";
        //     default:
        //         return mappedName?.replace(/([A-Z])/g, ' $1').trim() ?? "<undefined>";
        // }
    }
    static positionFromNumber(n) {
        var s = ["th", "st", "nd", "rd"],
            v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }
    static fromWeatherSlot(slot, enums){
        let weatherList = enums.weather?.list;
        return weatherList?.find((w) => w.value === slot)?.name;
    }
}
export default NameMapper;