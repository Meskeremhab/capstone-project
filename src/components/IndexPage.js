import React, { useState, useEffect } from "react";
import { Container, Alert, Form, Button } from "react-bootstrap";
import Modify from "./Modify";

const IndexPage = ({ username, onMoreInfoClick }) => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [error, setError] = useState("");
  const [tickerInput, setTickerInput] = useState("");

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await fetch(`http://localhost:5000/${username}`, {
          headers: {
            Accept: "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch portfolio for username ${username}`);
        }
        const data = await response.json();
        setPortfolioData(data);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchPortfolio();
  }, [username]);

  const handleInputChange = (event) => {
    setTickerInput(event.target.value);
  };

  const handleMoreInfoClickLocal = () => {
    onMoreInfoClick(tickerInput); // Use the prop function to navigate
  };

  return (
    <Container>
      <h1>{username}'s Portfolio</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      {portfolioData && (
        <div>
          <h2>Portfolio Details:</h2>
          <pre>{JSON.stringify(portfolioData, null, 2)}</pre>
        </div>
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
      <Modify />
    </Container>
  );
};

export default IndexPage;
