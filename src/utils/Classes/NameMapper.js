class NameMapper {
    static fromTrackId( trackId, tracklist ) {
        switch(trackId){
            default:
                return tracklist?.find((t) => t.id === trackId)?.name.replaceAll('_',' ') ?? "<undefined>"
        }
    }
    static fromVehicleId( vehicleId ){

    }
    static fromVehicleClassId( vehicleClassId, classList ){
        let mappedName = classList?.find((v) => v.value === vehicleClassId)?.name
        .replaceAll('Cat','Caterham')
        .replaceAll('F-','Formula ')
        .replaceAll('_',' ');
        switch(mappedName){
            case "GT1":
            case "GT3":
            case "GT3 Gen2":
            case "GT4":
            case "GT5":
            case "LMDh":
            case "RX":
            case "DPI":
            case "TSICup":
                return mappedName;
            case "GTOpen":
                return "GT Open";
            default:
                return mappedName.replace(/([A-Z])/g, ' $1').trim() ?? "<undefined>";
        }
    }
}
export default NameMapper;