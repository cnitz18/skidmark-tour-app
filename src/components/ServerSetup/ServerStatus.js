//import capitalizeFirstLetter from '../../common/utils'
import AMS2API from "../../utils/AMS2API";
const ServerStatus = ({ serverStatus, editableFields }) => {
    let handleSubmit = (event) => {
        console.log('submitted:',event);
        event.preventDefault();
    }
    let capitalizeFirstLetter = function(str){
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    if( Object.keys(serverStatus).length ){
        return (
            <p>
                <h3>Server Status:</h3> 
                <button>
                    <a href={AMS2API + '/statusEdit'} class="button" target="_blank">Advanced Setup</a>
                </button>
                {Object.keys(serverStatus).map((key) => (
                    <p className='field-entry'>
                        {capitalizeFirstLetter(key)}: {typeof serverStatus[key] == 'object' ? JSON.stringify(serverStatus[key],null,' '): serverStatus[key].toString()}
                    </p>
                ))}
            </p>
        );
    }
    else {
        return (
            <h4 className='center-header'> No local server running. This page is a WIP and will eventually contain instructions on how to create/start a server</h4>
        );
    }
}

export default ServerStatus;