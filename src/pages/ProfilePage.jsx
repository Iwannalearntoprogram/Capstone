import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setErrorMsg('No token found. Please log in.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('/routes/auth/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data && response.data.username && response.data.role) {
          setProfile(response.data);
        } else {
          setErrorMsg('Incomplete profile data received.');
        }
      } catch (error) {
        console.error('Failed to load profile', error);
        setErrorMsg(
          error.response?.data?.message || 'Error loading profile. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <div>Loading profile...</div>;
  if (errorMsg) return <div style={{ color: 'red' }}>{errorMsg}</div>;
  if (!profile) return <div>No profile data available</div>;

  return (
    <div className="profile-page">
      <h2>User Profile</h2>
      <p><strong>Username:</strong> {profile.username || 'N/A'}</p>
      <p><strong>Role:</strong> {profile.role || 'N/A'}</p>

      {profile.role === 'admin' && (
        <>
          <hr />
          <h3>Admin Links</h3>
          <ul>
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/reports">Reports</a></li>
          </ul>
        </>
      )}
    </div>
  );
};

export default ProfilePage;
