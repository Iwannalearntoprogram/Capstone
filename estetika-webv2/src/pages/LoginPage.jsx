import React, { useState } from 'react';

import '../styles/Login.css';
import { Link } from 'react-router-dom';

import { Navigate } from 'react-router-dom';
import logo from '../assets/images/logo-moss-2.png';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // ✅ Import icons


// function LoginPage() {
//   const [formData, setFormData] = useState({ email: '', password: '' });
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [error, setError] = useState('');

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prevData) => ({
//       ...prevData,
//       [name]: value,
//     }));
//   };

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     setError('');

//     try {
//       const response = await fetch('http://localhost:3000/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(formData),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         // Save token and role to localStorage
//         localStorage.setItem('token', data.token);  // save token
//         localStorage.setItem('role', data.role);    // save role (assumed from backend)

//         setIsLoggedIn(true);
//       } else {
//         setError(data.message || 'Invalid credentials');
//       }
//     } catch (err) {
//       console.error('Login error:', err);
//       setError('Something went wrong. Please try again.');
//     }
//   };

//   if (isLoggedIn) {
//     return <Navigate to="/home" />;
//   }

//   return (
//     <div className="System-Name">
//       <div className="title-box"></div>

//       <div className="login-container">
//         <div className="login-box">
//           <img src={logo} alt="logo" className="logo" />
//           <h2 className="login-title">Welcome Back!</h2>

//           <form onSubmit={handleLogin}>
//             <input
//               type="email"
//               name="email"
//               placeholder="Email"
//               className="login-input"
//               value={formData.email}
//               onChange={handleChange}
//               required
//             />
//             <input
//               type="password"
//               name="password"
//               placeholder="Password"
//               className="login-input"
//               value={formData.password}
//               onChange={handleChange}
//               required
//             />
//             <button type="submit" className="login-button">Login</button>
//           </form>

//           {error && <p className="error-message">{error}</p>}
//           <p className="forgot-password">Forgot Password?</p>
//         </div>

//         <div className="prompt-box1">
//           <h2 className="prompt-title">New Here?</h2>
//           <p className="prompt-text">Create an account and discover a smarter way to plan, track, and collaborate!</p>
//           <Link to='/signup' className="link-button">
//             <button className="prompt-button">Sign Up</button>
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// }


// export default LoginPage;



function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); // ✅ NEW STATE

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
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
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
            <div className="password-container"> {/* ✅ wrapper div */}
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                className="login-input"
                value={formData.password}
                onChange={handleChange}
                required
              />
            <span
              className="toggle-password"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>

            </div>
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

