import React from "react";
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

function ProfilePage() {
  const { user } = useAuth();

  return (
    <>
      {/* You can add Navbar and Sidebar here if needed */}
      <h1>Profile Page</h1>
      {user ? (
        <div>
          <p><strong>Name:</strong> {user.username || 'N/A'}</p>
          <p><strong>Role:</strong> {user.role || 'N/A'}</p>
        </div>
      ) : (
        <p>User not logged in.</p>
      )}
    </>
  );
}

export default ProfilePage;
