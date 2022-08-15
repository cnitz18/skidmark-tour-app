const APIDetails = ({ methods }) => {
    return (


        <table className="styled-table">
            <tr>
                <td>Name</td>
                <td>Description</td>
                <td>Response Type</td>
                <td>Parameters toString</td>
            </tr>
            {methods.map((m) => (
                <tr>
                    <td>{m.name}</td>
                    <td>{m.description}</td>
                    <td>{m.responsetype}</td>
                    <td>{m.parameters.toString()}</td>
                </tr>
                ))}
        </table>
    );
};

export default APIDetails;