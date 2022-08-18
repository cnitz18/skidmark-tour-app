import Form from 'react-bootstrap/Form';

const ServerSetupField = ({ attr, state, enums, updateState }) => {
    return (
        <div>
        <label>
            {attr.readableName}
            {
                attr.inputType === "number" ?
                <input type="number" value={state[attr.name]} onChange={e => updateState(e.target.value,attr.name)}></input> 
                :
                (
                    attr.inputType === "enum" ?
                    <select value={state[attr.name]} onChange={e => updateState(e.target.value,attr.name)}>
                        {   
                            enums.list ? 
                            enums.list.map(e => (
                            <option value={e.value} id={e.id}>{e.name}</option>
                            )) : 
                            <></>
                        }
                    </select>:
                    (
                        attr.inputType === "list" ? 
                        <></>:
                        (
                            attr.inputType === "boolean" ? 
                            <Form.Check 
                                type="switch"
                                id={attr.name}
                                value={state[attr.name] === 0}
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