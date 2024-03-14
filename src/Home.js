import React, { useState, useEffect } from "react";
import { BrowserRouter, Route, Switch, Redirect } from "react-router-dom";

import "./App.css";

const Home = () => {
  const [portfolioValue, setPortfolioValue] = useState(null);
  const [error, setError] = useState(null);
  const [inputTicker, setInputTicker] = useState("");
  const [stockDetails, setStockDetails] = useState(null);
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    // Fetch total portfolio value and stocks list
    console.log("Fetching portfolio data...");
    fetch("/api/portfolios", {
      credentials: "include", // For session cookies
    })
      .then((response) => {
        console.log("Portfolio data response received:", response);
        if (!response.ok) {
          throw new Error("Failed to fetch portfolio data");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Portfolio data:", data);
        setPortfolioValue(data.total_portfolio_value);
        setStocks(data.portfolioitem); // Assuming 'portfolioitem' is part of the response with the required format
      })
      .catch((error) => {
        console.error("Error fetching portfolio data:", error);
        setError(error.message);
      });
  }, []);

  const handleInputChange = (e) => {
    setInputTicker(e.target.value.toUpperCase());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputTicker) {
      console.log(`Fetching data for ticker: ${inputTicker}...`);
      fetch(`/api/stock/${inputTicker}`, {
        credentials: "include", // For session cookies
      })
        .then((response) => {
          console.log(`Data response for ticker ${inputTicker}:`, response);
          if (!response.ok) {
            throw new Error("Stock not found");
          }
          return response.json();
        })
        .then((data) => {
          console.log(`Data for ticker ${inputTicker}:`, data);
          setStockDetails(data);
          setError(null);
        })
        .catch((error) => {
          console.error(
            `Error fetching data for ticker ${inputTicker}:`,
            error
          );
          setError(error.message);
        });
    }
  };

  const handleDeleteItem = (itemId) => {
    fetch(`/delete_portfolio_item/${itemId}`, {
      method: "DELETE",
      credentials: "include", // For session cookies
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to delete item");
        }
        // Remove the deleted item from the stocks list
        setStocks((prevStocks) =>
          prevStocks.filter((stock) => stock.item_id !== itemId)
        );
      })
      .catch((error) => {
        setError(error.message);
      });
  };

  const handleEditItem = (itemId, newData) => {
    fetch(`/edit_portfolio_item/${itemId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newData),
      credentials: "include", // For session cookies
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to edit item");
        }
        // Update the item in the stocks list with the new data
        setStocks((prevStocks) =>
          prevStocks.map((stock) =>
            stock.item_id === itemId ? { ...stock, ...newData } : stock
          )
        );
      })
      .catch((error) => {
        setError(error.message);
      });
  };

  const handleAddItem = (newItemData) => {
    fetch("/api/stocks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newItemData),
      credentials: "include", // For session cookies
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to add item");
        }
        return response.json();
      })
      .then((data) => {
        // Add the new item to the stocks list
        setStocks((prevStocks) => [...prevStocks, newItemData]);
      })
      .catch((error) => {
        setError(error.message);
      });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Stock Tracker</h1>
        <div>
          <h2>My Stocks</h2>
          <ul>
            {stocks.map((stock) => (
              <li key={stock.item_id}>
                Symbol: {stock.ticker}, Quantity: {stock.quantity}{" "}
                <button onClick={() => handleDeleteItem(stock.item_id)}>
                  Delete
                </button>{" "}
                <button
                  onClick={() =>
                    handleEditItem(stock.item_id, {
                      quantity: stock.quantity + 1,
                    })
                  }
                >
                  Increment Quantity
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={inputTicker}
              onChange={handleInputChange}
              placeholder="Enter Stock Symbol"
            />
            <button type="submit">Get Stock Details</button>
          </form>
        </div>
        {error && <div>Error: {error}</div>}
        <p>
          Total Portfolio Value: $
          {portfolioValue ? portfolioValue.toFixed(2) : "Loading..."}
        </p>
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

export default Home;
