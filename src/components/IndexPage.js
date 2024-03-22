import React, { useState, useEffect } from "react";
import { Container, Alert, Navbar, Table, Form, Button } from "react-bootstrap";
import "./IndexPage.css"; 
import Modify from "./Modify";
import Header from './Header'; 
import Footer from './Footer'; 
import ChartComponent from './chartComponent';


const IndexPage = ({ userId, onMoreInfoClick }) => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [error, setError] = useState("");
  const [tickerInput, setTickerInput] = useState("");
  

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await fetch(`https://mcsbt-integration-416321.uc.r.appspot.com/${userId}`, {
          headers: { Accept: "application/json" },
          credentials: 'include',
        });
        
      
        if (!response.ok) throw new Error(`Failed to fetch portfolio for user ${userId}`);
        const data = await response.json();
        setPortfolioData(data);
        
      } catch (error) {
        setError(error.message);
      }
    };

    if (userId) fetchPortfolio();
  }, [userId]);

  
  const renderTableRows = () => {
    return portfolioData && Object.entries(portfolioData).map(([ticker, details]) => {
      if (ticker !== 'portfolio_value') {
        return (
          <tr key={ticker}>
            <td>{ticker}</td>
            <td>{details.quantity}</td>
            <td>${details.price.toFixed(2)}</td>
            <td>${details.total_value.toFixed(2)}</td>
            <td>{details.weighted_value.toFixed(2)}%</td>
          </tr>
        );
      }
      return null;
    });
  };

  

  const handleInputChange = (event) => {
    setTickerInput(event.target.value);
  };
  const handleMoreInfoClickLocal = () => {
    onMoreInfoClick(tickerInput);
  };
 
  return (
    <>
    <Header userId={userId} />
      <Container className="custom-container">
        <Navbar bg="light" expand="lg" className="justify-content-between">
          <Navbar.Brand>
          {userId && <div className="text-xl">Welcome {userId}</div>}
          </Navbar.Brand>
        </Navbar>
  
        {error && <Alert variant="danger">{error}</Alert>}
        <Table className="custom-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total Value</th>
              <th>Weighted Value (%)</th>
            </tr>
          </thead>
          <tbody>{renderTableRows()}</tbody>
          <tfoot>
            <tr>
              <td colSpan="3">Total Portfolio Value</td>
              <td colSpan="2">${portfolioData ? portfolioData.portfolio_value.toFixed(2) : ''}</td>
            </tr>
          </tfoot>
        </Table>
        <Table className="custom-table">
              <tbody>
                {/* First Row */}
                <tr>
                  <td>
                    <Form.Control
                      type="text"
                      placeholder="Enter ticker symbol"
                      value={tickerInput}
                      onChange={handleInputChange}
                    />
                  </td>
                  <td>
                    <Button variant="primary" onClick={() => onMoreInfoClick(tickerInput)}>
                      Details
                    </Button>
                  </td>
                  {/* Empty cells for alignment */}
                  <td></td>
                  <td></td>
                
                </tr>
                </tbody>
                </Table>

        {/* Modify component to handle all stock edits */}
        <Modify userId={userId} onActionComplete={onMoreInfoClick} />
        {portfolioData && (
  <ChartComponent data={portfolioData.someArray} /> 
)}
      </Container>
      <Footer />
    </>
  );
  
};

export default IndexPage;
