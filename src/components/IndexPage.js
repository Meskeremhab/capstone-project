import React, { useState, useEffect } from "react";
import { Container, Alert, Form, Button, Navbar } from "react-bootstrap";
import Modify from "./Modify";
import { Line } from 'react-chartjs-2';
import "./IndexPage.css"; // Import your custom CSS file
import AppHeader from './AppHeader'; // Import the AppHeader component

const IndexPage = ({ userId, onMoreInfoClick }) => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [error, setError] = useState("");
  const [tickerInput, setTickerInput] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await fetch(`https://mcsbt-integration-416321.uc.r.appspot.com/${userId}`, {
          headers: {
            Accept: "application/json",
          },
          credentials: 'include', 
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

  const transformDataForChart = () => {
    const labels = [];
    const openData = [];

    // Assuming you want to display the 'open' values over time
    data && data.map(item => {
      item.items.map((details) => {
        Object.entries(details.details.daily_time_series["Time Series (Daily)"]).map(([date, values]) => {
          labels.push(date);
          openData.push(parseFloat(values["1. open"]));
        });
      });
    });
<Button variant="primary" onClick={handleMoreInfoClickLocal} className="custom-button">
  Details
</Button>

    return {
      labels,
      datasets: [
        {
          label: 'Stock Open Prices',
          data: openData,
          fill: false,
          borderColor: 'rgba(75,192,192,1)',
        },
      ],
    };
  };

  const chartData = transformDataForChart();

  return (
    <>
      <AppHeader /> {/* Render the AppHeader component */}
      <Container className="custom-container">
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
          <Button variant="primary" onClick={handleMoreInfoClickLocal} className="custom-button">
            Details
          </Button>
        </Form>
        <Modify userId={userId} onActionComplete={handleMoreInfoClickLocal} />
        {/* Chart display */}
        {data && (
          <div>
            <Line data={chartData} />
          </div>
        )}
      </Container>
    </>
  );
};

export default IndexPage;
