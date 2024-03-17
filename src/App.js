import React, { useState } from 'react';
import Login from './components/Login'; // Make sure this path is correct
import SignUp from './components/SignUp'; // Make sure this path is correct
import IndexPage from './components/IndexPage'; // Make sure this path is correct
import Ticker from './components/Ticker'; // Make sure this path is correct
import UserProfile from './components/UserProfile'; // Make sure this path is correct

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem('userId') !== null);
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [ticker, setTicker] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);

  const onLoginSuccess = (userId) => {
    localStorage.setItem('userId', userId);
    setUserId(userId);
    setIsLoggedIn(true);
  };

  const onLoggedOut = () => {
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    setUserId(null);
    setTicker("");
  };

  const handleMoreInfoClick = (tickerSymbol) => {
    setTicker(tickerSymbol);
  };

  const resetTicker = () => {
    setTicker("");
  };

  const toggleSignUp = () => {
    setIsSigningUp(!isSigningUp);
  };

  const onSignUpSuccess = (userId) => {
    onLoginSuccess(userId);
  };

  return (
    <div>
      {!isLoggedIn ? (
        isSigningUp ? (
          <SignUp onSignUpSuccess={onSignUpSuccess} />
        ) : (
          <Login onLoginSuccess={onLoginSuccess} onSignUp={toggleSignUp} />
        )
      ) : (
        <>
          <UserProfile userId={userId} onLoggedOut={onLoggedOut} />
          {ticker ? (
            <>
              <Ticker ticker={ticker} />
              <button onClick={resetTicker}>Back to Portfolio</button>
            </>
          ) : (
            <IndexPage userId={userId} onMoreInfoClick={handleMoreInfoClick} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
