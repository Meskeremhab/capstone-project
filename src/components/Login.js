import React, { useState } from "react";
import Alert from 'react-bootstrap/Alert';
import {
  MDBBtn,
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBInput
} from 'mdb-react-ui-kit';
import './Login.css';

function Login({ onLoginSuccess, onSignUp }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotPasswordAlert, setForgotPasswordAlert] = useState(false);
  const [createAccountMessage, setCreateAccountMessage] = useState(false);

  const handleForgotPassword = () => {
    console.log("Forgot password clicked");
    setForgotPasswordAlert(true);
   
    setCreateAccountMessage(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch('https://mcsbt-integration-416321.uc.r.appspot.com/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          password: password
        }),
        credentials: 'include'
      });

      const data = await response.json();
      if (response.ok && data.error_code === 200) {
        onLoginSuccess(userId);
      } else {
        setError(data.message || "Invalid login credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MDBContainer className="login-container">
      <div className="login-form">
        <MDBRow>
          <MDBCol className="text-center">
            <h3 className="mb-4">Please login to your account</h3>
          </MDBCol>
        </MDBRow>

        {error && <div className="error-message">{error}</div>}
        {createAccountMessage && <div className="error-message">Please create a new account</div>}

        <MDBInput className='mb-4 login-input' placeholder='User ID' type='text' value={userId} onChange={(e) => setUserId(e.target.value)} disabled={loading} />
        <MDBInput className='mb-4 login-input' placeholder='Password' type='password' value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />

        <MDBBtn className="mb-4 form-button login-button" onClick={handleSubmit} disabled={loading}>
          {loading ? "Logging in..." : "LOGIN"}
        </MDBBtn>

        <div className="text-center mb-4">
          <a className="form-link" href="#!" onClick={handleForgotPassword}>Forgot password?</a>
        </div>

        <div className="text-center">
          <a className="form-link" href="#!" onClick={onSignUp}>Don't have an account? Register here</a>
        </div>
      </div>
    </MDBContainer>
  );
}

export default Login;
