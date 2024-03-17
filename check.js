import React, { useState, useEffect } from "react";
import "./App.css";

const App = () => {
  const [portfolioValue, setPortfolioValue] = useState(null);
  const [error, setError] = useState(null);
  const [inputTicker, setInputTicker] = useState("");
  const [stockDetails, setStockDetails] = useState(null);
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    // Fetch total portfolio value and stocks list
    fetch("/api/portfolios", {
      credentials: "include", // For session cookies
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch portfolio data");
        }
        return response.json();
      })
      .then((data) => {
        setPortfolioValue(data.total_portfolio_value);
        setStocks(data.stocks); // Assuming 'stocks' is part of the response with the required format
      })
      .catch((error) => {
        setError(error.message);
      });
  }, []);

  const handleInputChange = (e) => {
    setInputTicker(e.target.value.toUpperCase());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputTicker) {
      fetch(`/api/stock/${inputTicker}`, {
        credentials: "include", // For session cookies
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Stock not found");
          }
          return response.json();
        })
        .then((data) => {
          setStockDetails(data);
          setError(null);
        })
        .catch((error) => {
          setError(error.message);
        });
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Stock Tracker</h1>
        {error && <div>Error: {error}</div>}
        <div>
          <h2>My Stocks</h2>
          <ul>
            {stocks.map((stock, index) => (
              <li key={index}>
                Symbol: {stock.ticker}, Quantity: {stock.quantity}
              </li>
            ))}
          </ul>
        </div>

        <p>
          Total Portfolio Value: $
          {portfolioValue ? portfolioValue.toFixed(2) : "Loading..."}
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={inputTicker}
            onChange={handleInputChange}
            placeholder="Enter Stock Symbol"
          />
          <button type="submit">Get Stock Details</button>
        </form>

        {stockDetails && (
          <div>
            <h2>Stock Details</h2>
            <p>Symbol: {stockDetails.ticker}</p>
            <p>Latest Close Price: ${stockDetails.latest_close_price}</p>
            {/* Add any additional stock details you'd like to display here */}
          </div>
        )}
      </header>
    </div>
  );
};

export default App;
