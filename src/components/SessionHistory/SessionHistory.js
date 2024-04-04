import { useEffect, useState } from "react";
import getAPIData from "../../utils/getAPIData";
import SessionHistoryEntry from "./SessionHistoryEntry";
import PageHeader from "../shared/NewServerSetupPageHeader";
import { Spinner, ToggleButton, ToggleButtonGroup, Container, Row, Col, Form } from "react-bootstrap";

const SessionHistory = ({ enums, lists }) => {
  const [history, setHistory] = useState([]);
  // TODO: this feels really inefficient computing-wise but timewise tonight saves me headache
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [showSpinner, setShowSpinner] = useState(true);
  const [filterFinishedOnly, setFilterFinishedOnly] = useState(true);
  const [sortOptionSelected,setSortOptionSelected] = useState('dateDesc')

  const radios = [
    { name: 'Finished Only', value: true },
    { name: 'All', value: false },
  ];
  
  function updateFilteredHistory(){
    //Sort history
    var sortFunc;
    switch( sortOptionSelected ){
      case 'dateAsc':
        sortFunc = (a,b) => a.end_time - b.end_time
        break;
      default:
        sortFunc = (a,b) => b.end_time - a.end_time
    }
    //filter history
    var filterFunc = (h) => filterFinishedOnly ? h.finished === true: true

    setFilteredHistory([
      ...history.sort(sortFunc).filter(filterFunc)
    ])
  }
  function handleFilters(e){
    setFilterFinishedOnly(e.currentTarget.value === "true" )    
  }
  function handleSort(e){
    setSortOptionSelected(e.currentTarget.value)
  }

  useEffect(() => {
    getAPIData("/api/batchupload/sms_stats_data/").then((res) => {
      if (res) {
        setHistory([...res]);
        setShowSpinner(false);
      }
    });
    // eslint-disable-next-line
  }, [enums,lists]);

  useEffect(() => {
    updateFilteredHistory();
  },[filterFinishedOnly,history,sortOptionSelected])

  return (
    <>
      <PageHeader title="Race History" />
      {showSpinner ? (

                <div className="text-center mt-4">
                    <Spinner animation="border" role="status"/>
                      <div>
                        One moment please...
                      </div>
                </div>
            ) : 
            (
              <Container>
                <Row>
                  <Col sm>
                    <div>Filters:</div>
                    <ToggleButtonGroup type="radio" name="options" defaultValue={true}>
                      {radios.map((radio, idx) => (
                        <ToggleButton
                          key={idx}
                          id={`radio-${idx}`}
                          variant={idx % 2 ? 'outline-warning' : 'outline-success'}
                          value={radio.value}
                          checked={filterFinishedOnly === radio.value}
                          onChange={handleFilters}
                        >
                          {radio.name}
                        </ToggleButton>
                      ))}
                    </ToggleButtonGroup>
                  </Col>
                  <Col></Col>
                  <Col sm>
                    Order By:
                    <Form.Select aria-label="Default select example" onChange={handleSort}>
                      <option value="dateDesc">Date Descending</option>
                      <option value="dateAsc">Date Ascending</option>
                    </Form.Select>
                  </Col>
                </Row>
                {/* History List */}
                <Row>
                {
                  filteredHistory
                  .map((h, i) => 
                  <SessionHistoryEntry key={h._id} data={h} enums={enums} lists={lists} />
                  ) 
                }
                </Row>
              </Container>

            )
      }
    </>
  );
};
export default SessionHistory;
