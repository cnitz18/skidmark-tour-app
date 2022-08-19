import Form from 'react-bootstrap/Form';

const ServerSetupField = ({ attr, state, enums, list, updateState }) => {
    return (
        <div>
        <label>
            {attr.readableName}
            {
                attr.inputType === "number" ?
                <input type="number" value={state[attr.name]} onChange={e => updateState(attr.name,e.target.value)}></input> 
                :
                (
                    attr.inputType === "enum" ?
                    <select value={state[attr.name]} onChange={e => updateState(attr.name,e.target.value)}>
                        {   
                            enums.length ? 
                            enums.map(e => (
                                <option value={e.value} id={e.id} key={e.id}>{e.name}</option>
                            )) : <></>
                        }
                    </select>:
                    (
                        attr.inputType === "list" ? 
                        <select value={state[attr.name]} onChange={e => updateState(attr.name,e.target.value)}>
                            {
                                list.length ? 
                                list.map(l => (
                                    <option value={l.id??l.value} id={l.value} key={l.value}>{l.name}</option>
                                )) : <></>
                            }                            
                        </select>:
                        (
                            attr.inputType === "boolean" ? //console.log(attr,state[attr.name]) : <></>
                            <Form.Check 
                                type="switch"
                                id={attr.name}
                                checked={state[attr.name] === 1}
                                onChange={e => { updateState(attr.name,e.target.checked ? 1 : 0) }}
                            />:
                            <></>
                        )
                    )
                )
            }
        </label>
        </div>
    );
}
export default ServerSetupField;