import React from 'react'
import '../styles/Login.css';
import { Link } from 'react-router-dom';
import logo from '../assets/images/logo-moss-2.png';

 function SignupPage() {
    return (

        <div className="System-Name">
          {/* Title */}
          <div className="title-box">
            {/* <h1 className="Title">Estetika</h1> */}
          </div>
          
    
        <div className="login-container">
          {/* left Side - log in Section */}
      <div className="prompt-box2">
        <h2 className="prompt-title">Welcome Back!</h2>
        <p className="prompt-text"> Log in and keep your projects moving forward!</p>
        <Link to='/' className="link-button"> <button className="prompt-button">Log In</button></Link>
      </div>


      {/*  right side - sign up Form */}
      <div className="signup-box">
      <div>
            <img src={logo} alt="logo" className='logo' />
            </div>
            <h2 className="signup-title">Create Account</h2>
            <input type="text" placeholder="Name" className="signup-input" />
            <input type="text" placeholder="Username" className="signup-input" />
            <input type="password" placeholder="Password" className="signup-input" />
            <button className="signup-button">Sign Up</button>
            
    
          </div>
    </div>
    </div>
      );
    }
export default SignupPage;
