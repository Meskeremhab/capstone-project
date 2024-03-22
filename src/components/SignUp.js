import './SignUp.css';
import React, { useState } from "react";
import { MDBBtn, MDBContainer, MDBCard, MDBCardBody, MDBCol, MDBRow, MDBInput, MDBIcon } from 'mdb-react-ui-kit';

function SignUp({ onSignUpSuccess, navigateToLogin }) {
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
      const response = await fetch(
        "https://mcsbt-integration-416321.uc.r.appspot.com/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            user_id: userId,
            user_name: userName,
            password: password,
            user_mail: userMail,
          }),
        }
      );

      const data = await response.json();
      if (response.ok && data.error_code === 200) {
        onSignUpSuccess(data.user_id); // Assuming you want to automatically log in the user
      } else {
        setError(data.message || "An error occurred during signup.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setError("An error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin =() => {
    navigateToLogin();
  };

  return (
    <MDBContainer fluid className="sign-up-container">
      <MDBCard className='sign-up-card shadow-5' style={{ borderRadius: '15px' }}>
        <MDBCardBody className='p-5 text-center'>
          <h2 className="fw-bold mb-5">Sign Up</h2>
          <MDBCol md="10" className="offset-md-1">
            <MDBInput wrapperClass='mb-4' id='user_id' type='text' value={userId} onChange={(e) => setUserId(e.target.value)} placeholder='User ID' disabled={loading} required />
            <MDBInput wrapperClass='mb-4' id='user_name' type='text' value={userName} onChange={(e) => setUserName(e.target.value)} placeholder='Name' disabled={loading} required />
            <MDBInput wrapperClass='mb-4' id='user_mail' type='email' value={userMail} onChange={(e) => setUserMail(e.target.value)} placeholder='Email address' disabled={loading} required />
            <MDBInput wrapperClass='mb-4' id='password' type='password' value={password} onChange={(e) => setPassword(e.target.value)} placeholder='Password' disabled={loading} required />
            {error && <p className="text-danger mt-1 mb-0">{error}</p>}
          </MDBCol>
          <MDBBtn className='w-100 mb-4 sign-up-button' size='md' onClick={handleSignUpSubmit} disabled={loading}>Sign Up</MDBBtn>
          <div className="mt-3">
            <p className="mb-0 text-center">
              Already have an account?{" "}
              <a href="#!" className="text-primary fw-bold" onClick={handleBackToLogin}>
                Log In
              </a>
            </p>
          </div>
        </MDBCardBody>
      </MDBCard>
    </MDBContainer>
  );
}

export default SignUp;