import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import logo from '../assets/images/logo-moss-2.png';

function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    phoneNumber: '',
    role: 'client'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        navigate('/');
      } else {
        alert(data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="System-Name">
      <div className="title-box"></div>
      <div className="login-container">
        <div className="prompt-box2">
          <h2 className="prompt-title">Welcome Back!</h2>
          <p className="prompt-text">Log in and keep your projects moving forward!</p>
          <Link to='/' className="link-button">
            <button className="prompt-button">Log In</button>
          </Link>
        </div>

        <div className="signup-box">
          <img src={logo} alt="logo" className='logo' />
          <h2 className="signup-title">Create Account</h2>
          <form onSubmit={handleSubmit}>
            <input type="text" name="firstName" placeholder="First Name" className="signup-input" value={formData.firstName} onChange={handleChange} required />
            <input type="text" name="lastName" placeholder="Last Name" className="signup-input" value={formData.lastName} onChange={handleChange} required />
            <input type="email" name="email" placeholder="Email" className="signup-input" value={formData.email} onChange={handleChange} required />
            <input type="text" name="username" placeholder="Username" className="signup-input" value={formData.username} onChange={handleChange} required />
            <input type="password" name="password" placeholder="Password" className="signup-input" value={formData.password} onChange={handleChange} required />
            <input type="text" name="phoneNumber" placeholder="Phone Number" className="signup-input" value={formData.phoneNumber} onChange={handleChange} required />
            <select name="role" className="signup-input" value={formData.role} onChange={handleChange}>
              <option value="client">Client</option>
              <option value="designer">Designer</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className="signup-button">Sign Up</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
