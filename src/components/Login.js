import React, { useState } from "react";
import { Form, Button, Container, Col, Alert } from "react-bootstrap";

function Login({ onLoginSuccess, onSignUp }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch('http://localhost:5000/login', {
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
        onLoginSuccess(userId); // Notify the parent component
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
    <Container>
      <h2>Login</h2>
      <Col md={6} className="mt-3">
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="userId">
            <Form.Label>User ID</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter user ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={loading}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </Form.Group>
          <div className="d-flex justify-content-between">
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
            <Button variant="secondary" onClick={onSignUp} disabled={loading}>
              Sign Up
            </Button>
          </div>
        </Form>
      </Col>
    </Container>
  );
}

export default Login;
