import React, { useState, useEffect } from "react";
// Import any components from react-bootstrap if you plan to use them
// import { Container, Alert } from "react-bootstrap";

const Ticker = ({ ticker }) => {
  const [tickerData, setTickerData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // This effect runs when the 'ticker' prop changes
    const fetchTickerData = async () => {
      try {
        // Update the URL with your Flask backend endpoint
        const response = await fetch(
          `http://localhost:5000/stock/${ticker}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch info for ticker: ${ticker}`);
        }
        const data = await response.json();
        setTickerData(data);
      } catch (err) {
        setError(err.message);
      }
    };

    if (ticker) {
      fetchTickerData();
    }
  }, [ticker]); // Runs only when the ticker value changes

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}
      {tickerData && (
        // Replace this div with 'Container' from react-bootstrap if needed
        <div>
          <h1>Ticker: {ticker}</h1>
          <pre>{JSON.stringify(tickerData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Ticker;
