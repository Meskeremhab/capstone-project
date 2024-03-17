import React, { useState } from 'react';

const UserProfile = ({ userId, onLoggedOut }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = async () => {
    // Call your backend's logout endpoint
    const response = await fetch('http://localhost:5000/logout', {
      method: 'POST',
      credentials: 'include', // Required to handle cookies if used
    });

    if (response.ok) {
      // Logout successful
      onLoggedOut();
    } else {
      // Handle error
      console.error('Logout failed');
    }
  };

  return (
    <div style={{ position: 'absolute', top: 0, right: 0, padding: '10px' }}>
      <div onClick={toggleDropdown} style={{ cursor: 'pointer' }}>
        User: {userId} ▼
      </div>
      {isDropdownOpen && (
        <div>
          <div>User ID: {userId}</div>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
