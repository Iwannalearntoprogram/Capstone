import React, { useState } from 'react';
import '../styles/Login.css';
import { Link, Navigate } from 'react-router-dom';
import logo from '../assets/images/logo-moss-2.png';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token); // save token for protected routes
        login(data.user); // update AuthContext user state
        setIsLoggedIn(true);
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
    }
  };

  if (isLoggedIn) {
    return <Navigate to="/home" />;
  }

  return (
    <div className="System-Name">
      <div className="title-box"></div>

      <div className="login-container">
        <div className="login-box">
          <img src={logo} alt="logo" className="logo" />
          <h2 className="login-title">Welcome Back!</h2>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="login-input"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="login-input"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button type="submit" className="login-button">Login</button>
          </form>

          {error && <p className="error-message">{error}</p>}
          <p className="forgot-password">Forgot Password?</p>
        </div>

        <div className="prompt-box1">
          <h2 className="prompt-title">New Here?</h2>
          <p className="prompt-text">Create an account and discover a smarter way to plan, track, and collaborate!</p>
          <Link to='/signup' className="link-button">
            <button className="prompt-button">Sign Up</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
