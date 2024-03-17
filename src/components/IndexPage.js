import React, { useState, useEffect } from "react";
import { Container, Alert, Form, Button, Navbar } from "react-bootstrap";
import Modify from "./Modify";

const IndexPage = ({ userId, onMoreInfoClick }) => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [error, setError] = useState("");
  const [tickerInput, setTickerInput] = useState("");

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await fetch(`http://localhost:5000/${userId}`, {
          headers: {
            Accept: "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch portfolio for user ${userId}`);
        }
        const data = await response.json();
        setPortfolioData(data);
      } catch (error) {
        setError(error.message);
      }
    };

    if (userId) {
      fetchPortfolio();
    }
  }, [userId]);

  const handleInputChange = (event) => {
    setTickerInput(event.target.value);
  };

  const handleMoreInfoClickLocal = () => {
    onMoreInfoClick(tickerInput);
  };

  return (
    <Container>
      <Navbar bg="light" expand="lg" className="justify-content-between">
        <Navbar.Brand>Welcome to the Portfolio</Navbar.Brand>
      </Navbar>

      {error && <Alert variant="danger">{error}</Alert>}
      {portfolioData && (
        <>
          <h2>Portfolio Details:</h2>
          <pre>{JSON.stringify(portfolioData, null, 2)}</pre>
        </>
      )}
      <Form>
        <Form.Group controlId="tickerInput">
          <Form.Label>Enter Ticker Symbol</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter ticker symbol"
            value={tickerInput}
            onChange={handleInputChange}
          />
        </Form.Group>
        <Button variant="primary" onClick={handleMoreInfoClickLocal}>
          More Info
        </Button>
      </Form>
      <Modify userId={userId} onActionComplete={handleMoreInfoClickLocal} />
    </Container>
  );
};

export default IndexPage;