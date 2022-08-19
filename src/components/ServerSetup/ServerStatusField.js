import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

const ServerStatusField = ({ statusField, state }) => {
    return (
        <OverlayTrigger placement='right' overlay={<Tooltip id="tooltip-disabled">{statusField.description}</Tooltip>}>
            <label className="field-entry"> 
                {statusField.readableName}:   
                {"     ("+state+")"}
            </label>
        </OverlayTrigger>
    );
}
export default ServerStatusField;