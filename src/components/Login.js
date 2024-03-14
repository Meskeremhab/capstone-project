// Login.js
import React, { useState } from "react";
import { Form, Button, Container, Col, Alert } from "react-bootstrap";

function Login({ onLoginSuccess }) {
  // Prop for handling login success
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loggedInSuccess, setLoggedInSuccess] = useState(false); // State to track login success

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoggedInSuccess(false); // Reset login success state on new submission
    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_name: username,
          password: password,
        }),
      });
      const data = await response.json();
      if (response.ok && data.error_code === 200) {
        setLoggedInSuccess(true); // Set login success state
        onLoginSuccess(username); // Call the prop function to notify parent component
        setLoginError("");
      } else {
        setLoginError("Invalid username or password.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <h2>Login</h2>
      <Col xs={12} md={6} className="mt-4">
        {loggedInSuccess && (
          <Alert variant="success">Logged in successfully!</Alert>
        )}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formBasicPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Group>

          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </Form>
        {loginError && <p className="text-danger mt-3">{loginError}</p>}
      </Col>
    </Container>
  );
}

export default Login;
