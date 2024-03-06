import React, { useState, useEffect } from "react";
import "./App.css";

const App = () => {
  const [portfolioValue, setPortfolioValue] = useState(null);
  const [error, setError] = useState(null);
  const [inputTicker, setInputTicker] = useState("");
  const [stockDetails, setStockDetails] = useState(null);
  const [stocks, setStocks] = useState([]);

  // Fetch total portfolio value
  useEffect(() => {
    fetch("https://mcsbt-integration-416321.uc.r.appspot.com/api/portfolios")
      .then((response) => response.json())
      .then((data) => {
        setPortfolioValue(data.total_portfolio_value);
      })

      .catch((error) => setError(error.message));

    // Fetching stock list
    fetch("https://mcsbt-integration-416321.uc.r.appspot.com/api/stocks")
      .then((response) => response.json())
      .then((stocksData) => {
        setStocks(
          stocksData.portfolios.flatMap((portfolio) => portfolio.items)
        );
      })
      .catch((error) => setError(error.message));
  }, []);

  // Handler for input change
  const handleInputChange = (e) => {
    setInputTicker(e.target.value.toUpperCase());
  };

  // Handler for form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputTicker) {
      fetch(
        `https://mcsbt-integration-416321.uc.r.appspot.com/api/stock/${inputTicker}`
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            setError("Stock not found.");
          } else {
            setStockDetails(data); // Now 'data' should contain the full time series data
            setError(null);
          }
        })
        .catch((error) => setError(error.message));
    }
  };

  // Helper function to transform time series data into an array of entries
  const transformTimeSeriesData = (timeSeriesData) => {
    return Object.entries(timeSeriesData).map(([date, values]) => ({
      date,
      open: values["1. open"],
      high: values["2. high"],
      low: values["3. low"],
      close: values["4. close"],
      volume: values["5. volume"],
    }));
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

            <details>
              <summary>More Details</summary>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Open</th>
                    <th>High</th>
                    <th>Low</th>
                    <th>Close</th>
                    <th>Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {transformTimeSeriesData(stockDetails.time_series_daily).map(
                    (entry, index) => (
                      <tr key={index}>
                        <td>{entry.date}</td>
                        <td>{entry.open}</td>
                        <td>{entry.high}</td>
                        <td>{entry.low}</td>
                        <td>{entry.close}</td>
                        <td>{entry.volume}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </details>
          </div>
        )}
      </header>
    </div>
  );
};

export default App;
