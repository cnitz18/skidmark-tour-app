import { useEffect, useState } from "react";
import getAPIData from "../../utils/getAPIData";
import SessionHistoryEntry from "./SessionHistoryEntry";
import PageHeader from "../shared/PageHeader";
import { Spinner, ToggleButton, ToggleButtonGroup, Container, Row, Col, Form, Pagination, Accordion } from "react-bootstrap";
import LoadingOverlay from 'react-loading-overlay-ts';
import UnavailablePage from "../NewServerSetup/NewServerUnavailablePage";

const SessionHistory = ({ enums, lists }) => {
  const [history, setHistory] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [paginators, setPaginators] = useState([])
  const [curPage, setCurPage] = useState(1)
  // TODO: this feels really inefficient computing-wise but timewise tonight saves me headache
  const [showErrorPage, setShowErrorPage] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [showMiniSpinner, setShowMiniSpinner] = useState(false);
  const [filter, setFilter] = useState('finished-only');
  const [sortOptionSelected,setSortOptionSelected] = useState('dateDesc')

  const radios = [
    { name: 'Completed Races', filter: 'finished-only', variant: 'outline-success' },
    { name: 'League Races', filter: 'league-only', variant: 'outline-info' },
    { name: 'All', filter: 'all', variant: 'outline-warning' },
  ];

  function handleFilters(e){
    setCurPage(1)
    setFilter(e.currentTarget.value)
  }
  function handleSort(e){
    //console.log('setSortOptionSelected:',e.currentTarget.value)
    setSortOptionSelected(e.currentTarget.value)
  }
  function fetchCurrentPage(){
    setShowMiniSpinner(true)
    getAPIData("/api/batchupload/sms_stats_data/pagecount/?filter=" + filter)
    .then((res) => {
      setShowErrorPage(false);
      //console.log('setting paginators')
      if( parseInt(res) > -1 ){
        setPageCount(parseInt(res));
        const rows = [];
        for (let i = 1; i <= parseInt(res); i++) {
            rows.push(<Pagination.Item key={i} active={i===curPage} onClick={() => setCurPage(i)}>{i}</Pagination.Item>);
        }
        setPaginators(rows);
      }
        
    })
    .catch((err) => {
      console.error(err);
      setShowErrorPage(true);
      setShowSpinner(false);
    })
    getAPIData("/api/batchupload/sms_stats_data/?page=" + curPage + "&filter=" + filter + "&sort=" + (sortOptionSelected === "dateAsc" ? "asc" : "desc"))
    .then((res) => {
      if (res) {
        setShowErrorPage(false);
        //console.log('setting history')
        setHistory([...res]);
        setShowMiniSpinner(false);
        setShowSpinner(false);
      }
    })
    .catch((err) => {
      console.error(err);
      setShowErrorPage(true);
      setShowSpinner(false);
    });
  }

  useEffect(() => {
    fetchCurrentPage();
    // eslint-disable-next-line
  },[curPage,pageCount,filter,sortOptionSelected])

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
                    Order By:
                    <Form.Select aria-label="Default select example" onChange={handleSort}>
                      <option value="dateDesc">Date Descending</option>
                      <option value="dateAsc">Date Ascending</option>
                    </Form.Select>
                  </Col>
                  <Col></Col>
                  <Col sm>
                    <Accordion defaultActiveKey="0">
                      <Accordion.Item eventKey="0">
                        <Accordion.Header>Filters</Accordion.Header>
                        <Accordion.Body>
                          <ToggleButtonGroup type="radio" name="options" defaultValue={true} value={filter}>
                            {filter && radios.map((radio, idx) => (
                              <ToggleButton
                                key={idx}
                                id={`radio-${idx}`}
                                variant={radio.variant}
                                value={radio.filter}
                                onChange={handleFilters}
                                className="text-nowrap"
                              >
                                {radio.name}
                              </ToggleButton>
                            ))}
                          </ToggleButtonGroup>
                        </Accordion.Body>
                      </Accordion.Item>
                    </Accordion>
                  </Col>
                </Row>
                {/* History List */}
                <LoadingOverlay
                  active={showMiniSpinner}
                  spinner
                  text='Loading...'>  
                  <Row>
                    {
                      history
                      .map((h, i) => 
                        <SessionHistoryEntry key={i} data={h} enums={enums} lists={lists} />
                      ) 
                    }
                  
                  </Row>
                </LoadingOverlay>
                <Row>
                  <Col></Col>
                  <Col className="justify-content-md-center display-flex">
                      <Pagination>
                        {paginators}
                      </Pagination>
                  </Col>
                  <Col></Col>
                </Row>
              </Container>

            )
      }
      {
        showErrorPage && <UnavailablePage/>
      }
    </>
  );
};
export default SessionHistory;
