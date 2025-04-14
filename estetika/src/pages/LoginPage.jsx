import React from 'react';
import '../styles/Login.css';
import { Link } from 'react-router-dom';


function LoginPage() {
  return (

    <div className="System-Name">
      {/* Title */}
      <div className="title-box">
        <h1 className="Title">Estetika</h1>
      </div>
      

    <div className="login-container">
      {/* Left Side - Login Form */}
      <div className="login-box">
        <h2 className="login-title">Welcome Back!</h2>
        <input type="text" placeholder="Username" className="login-input" />
        <input type="password" placeholder="Password" className="login-input" />
        <Link to='/home' className="link-button"><button className="login-button">Login</button></Link>
        <p className="forgot-password">Forgot Password?</p>

      </div>

      {/* Right Side - Sign Up Section */}
      <div className="prompt-box1">
        <h2 className="prompt-title">New Here?</h2>
        <p className="prompt-text">Create an account and discover a smarter way to plan, track, and collaborate!</p>
        <Link to='/signup' className="link-button"> <button className="prompt-button">Sign Up</button></Link>
      </div>
    </div>
    </div>
  );
}

export default LoginPage;
