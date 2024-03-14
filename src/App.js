import React, { useState } from "react";
import Login from "./components/Login";
import IndexPage from "./components/IndexPage";
import Ticker from "./components/Ticker"; // Make sure you have this component created as per previous discussions

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [ticker, setTicker] = useState(""); // State to hold the selected ticker symbol

  // This function gets called when the login is successful
  const onLoginSuccess = (user) => {
    setIsLoggedIn(true);
    setUsername(user);
  };

  // This function is passed to IndexPage and gets called with the selected ticker symbol
  const handleMoreInfoClick = (tickerSymbol) => {
    setTicker(tickerSymbol);
  };

  // Optional: Call this function to "logout" or to go back to the index page from the ticker page
  const resetTicker = () => {
    setTicker(""); // This will stop rendering the Ticker component
  };

  return (
    <div>
      {!isLoggedIn ? (
        // If not logged in, show the Login component
        <Login onLoginSuccess={onLoginSuccess} />
      ) : (
        <>
          {ticker ? (
            // If a ticker symbol is selected, show the Ticker component
            <>
              <Ticker ticker={ticker} />
              <button onClick={resetTicker}>Back to Portfolio</button>
            </>
          ) : (
            // Otherwise, show the IndexPage
            <IndexPage
              username={username}
              onMoreInfoClick={handleMoreInfoClick}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
