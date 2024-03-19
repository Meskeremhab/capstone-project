import React, { useState } from "react";
import { Form, Button, Container, Col, Alert } from "react-bootstrap";

function SignUp({ onSignUpSuccess }) {
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [userMail, setUserMail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignUpSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    // Validate input
    if (!userId || !userName || !password || !userMail) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('https://mcsbt-integration-416321.uc.r.appspot.com/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          user_id: userId,
          user_name: userName,
          password: password,
          user_mail: userMail
        })
      });

      const data = await response.json();
      if (response.ok && data.error_code === 200) {
        onSignUpSuccess(userId); // Assuming you want to automatically log in the user
      } else {
        setError(data.message || "An error occurred during signup.");
      }} catch (error) {
      console.error("Signup error:", error);
      setError("An error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <h2>Sign Up</h2>
      <Col md={6} className="mt-3">
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSignUpSubmit}>
          <Form.Group className="mb-3" controlId="userId">
            <Form.Label>User ID</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter user ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={loading}
              isInvalid={!!error}
            />
            <Form.Control.Feedback type="invalid">
              {error}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="userName">
            <Form.Label>User Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter user name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              disabled={loading}
              isInvalid={!!error}
            />
            <Form.Control.Feedback type="invalid">
              {error}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              isInvalid={!!error}
            />
            <Form.Control.Feedback type="invalid">
              {error}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="userMail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              value={userMail}
              onChange={(e) => setUserMail(e.target.value)}
              disabled={loading}
              isInvalid={!!error}
            />
            <Form.Control.Feedback type="invalid">
              {error}
            </Form.Control.Feedback>
          </Form.Group>

          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? "Signing up..." : "Sign Up"}
          </Button>
        </Form>
      </Col>
    </Container>
  );
}

export default SignUp;