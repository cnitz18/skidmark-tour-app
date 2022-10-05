import { useState, useEffect } from "react";
import {Form} from 'react-bootstrap';
import { Accordion } from "react-bootstrap";

const ServerSetupFlags = ({ flags, flagsVal,  updateState }) => {
    const [flagStatuses,setFlagStatuses] = useState({});
    const [curFlags,setCurFlags] = useState(0);
    function updateFlag(field,val){
        console.log('updating flags:',field,val)
        console.log('curState:',flagsVal);
        let flagStatus = {};
        let curVal = curFlags;
        flags?.session?.sort((a,b)=> Math.abs(a.value) - Math.abs(b.value)).forEach((f) => {
                flagStatus[f.name] = false;
                if( (curVal - f.value) > 0 ){
                    console.log("ENABLED:",curVal)
                }
        });
    }
    useEffect(() => {

        console.log('FLAGS:',flags,flags.length,flagsVal);
        setCurFlags(flagsVal)
        let curValue = flagsVal;
        let flagStatus = {};
        let flagInfo = flags.session?.list;
        flagInfo.sort((a,b)=> Math.abs(b.value) - Math.abs(a.value)).forEach((f) => {
                console.log('f',f,f.value,curValue,curValue-f.value)
                flagStatus[f.name] = false;
                if( (curValue - f.value) > 0 ){
                    curValue -= f.value;
                    flagStatus[f.name] = true;
                }
        });
        console.log('flagStatus:',JSON.stringify(flagStatus,null,' '));
        setFlagStatuses({ ...flagStatus })
    }, [flags]);

    return (
        <Accordion>
            <Accordion.Header>
                Expand
            </Accordion.Header>
            <Accordion.Body>
                {
                    
                    Object.keys(flagStatuses).length ?
                    Object.keys(flagStatuses).map((st) => (
                        <div>
                            <label>{st}</label>
                            <Form.Check 
                                type="switch"
                                id={st}
                                checked={flagStatuses[st]}
                                onChange={e => { updateFlag(st,e.target.checked) }}
                                />
                        </div>
                    ))
                    :<></> 
                }
                </Accordion.Body>
        </Accordion>

    );
}
export default ServerSetupFlags;