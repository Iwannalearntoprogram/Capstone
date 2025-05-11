// import React, { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { FaEye, FaEyeSlash } from 'react-icons/fa';
// import '../styles/Login.css';
// import logo from '../assets/images/logo-moss-2.png';

// function SignupPage() {
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     email: '',
//     username: '',
//     password: '',
//     confirmPassword: '',
//     phoneNumber: '',
//     role: 'client',
//   });

//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [acceptedTerms, setAcceptedTerms] = useState(false);
//   const [passwordError, setPasswordError] = useState(''); // <-- NEW

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     if (type === 'checkbox') {
//       setAcceptedTerms(checked);
//     } else {
//       setFormData((prevData) => ({
//         ...prevData,
//         [name]: value,
//       }));

//       // Validate password strength live
//       if (name === 'password') {
//         validatePassword(value);
//       }
//     }
//   };

//   const togglePasswordVisibility = () => {
//     setShowPassword((prev) => !prev);
//   };

//   const toggleConfirmPasswordVisibility = () => {
//     setShowConfirmPassword((prev) => !prev);
//   };

//   // Password strength validator
//   const validatePassword = (password) => {
//     const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

//     if (!passwordRegex.test(password)) {
//       setPasswordError('Password must be at least 8 characters, include 1 uppercase letter, 1 number, and 1 special character.');
//     } else {
//       setPasswordError('');
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!acceptedTerms) {
//       alert('You must accept the Terms and Conditions.');
//       return;
//     }

//     if (formData.password !== formData.confirmPassword) {
//       alert('Passwords do not match.');
//       return;
//     }

//     if (passwordError) {
//       alert('Password is too weak.');
//       return;
//     }

//     const { confirmPassword, ...dataToSend } = formData;

//     try {
//       const response = await fetch('http://localhost:3000/api/auth/register', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(dataToSend),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         alert(data.message);
//         navigate('/');
//       } else {
//         alert(data.message || 'Something went wrong');
//       }
//     } catch (error) {
//       console.error('Error:', error);
//       alert('An error occurred. Please try again.');
//     }
//   };

//   return (
//     <div className="System-Name">
//       <div className="title-box"></div>
//       <div className="login-container">
//         <div className="prompt-box2">
//           <h2 className="prompt-title">Welcome Back!</h2>
//           <p className="prompt-text">Log in and keep your projects moving forward!</p>
//           <Link to='/' className="link-button">
//             <button className="prompt-button">Log In</button>
//           </Link>
//         </div>

//         <div className="signup-box">
//           <img src={logo} alt="logo" className="logo" />
//           <h2 className="signup-title">Create Account</h2>

//           <form onSubmit={handleSubmit}>
//             <input type="text" name="firstName" placeholder="First Name" className="signup-input" value={formData.firstName} onChange={handleChange} required />
//             <input type="text" name="lastName" placeholder="Last Name" className="signup-input" value={formData.lastName} onChange={handleChange} required />
//             <input type="email" name="email" placeholder="Email" className="signup-input" value={formData.email} onChange={handleChange} required />
//             <input type="text" name="username" placeholder="Username" className="signup-input" value={formData.username} onChange={handleChange} required />

//             {/* Password Field */}
//             <div className="password-input-wrapper">
//               <input
//                 type={showPassword ? 'text' : 'password'}
//                 name="password"
//                 placeholder="Password"
//                 className="signup-input"
//                 value={formData.password}
//                 onChange={handleChange}
//                 required
//               />
//               <span onClick={togglePasswordVisibility} className="password-toggle-icon">
//                 {showPassword ? <FaEyeSlash /> : <FaEye />}
//               </span>
//             </div>

//             {/* Password Strength Message */}
//             {passwordError && <p className="password-error">{passwordError}</p>}

//             {/* Confirm Password Field */}
//             <div className="password-input-wrapper">
//               <input
//                 type={showConfirmPassword ? 'text' : 'password'}
//                 name="confirmPassword"
//                 placeholder="Confirm Password"
//                 className="signup-input"
//                 value={formData.confirmPassword}
//                 onChange={handleChange}
//                 required
//               />
//               <span onClick={toggleConfirmPasswordVisibility} className="password-toggle-icon">
//                 {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
//               </span>
//             </div>

//             <input type="text" name="phoneNumber" placeholder="Phone Number" className="signup-input" value={formData.phoneNumber} onChange={handleChange} required />

//             <select name="role" className="signup-input" value={formData.role} onChange={handleChange}>
//               <option value="client">Client</option>
//               <option value="designer">Designer</option>
//               <option value="admin">Admin</option>
//             </select>

//             {/* Terms and Conditions Checkbox */}
//             <div className="terms-checkbox">
//               <input
//                 type="checkbox"
//                 id="terms"
//                 name="terms"
//                 checked={acceptedTerms}
//                 onChange={handleChange}
//               />
//               <label htmlFor="terms">I accept the Terms and Conditions</label>
//             </div>

//             <button type="submit" className="signup-button">Sign Up</button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default SignupPage;


import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
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
    confirmPassword: '',
    phoneNumber: '',
    role: 'client',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setAcceptedTerms(checked);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));

      if (name === 'password') {
        validatePassword(value);
      }
    }
  };

  const handlePhoneChange = (value) => {
    setFormData((prevData) => ({
      ...prevData,
      phoneNumber: value,
    }));

    if (!/^(\+63\d{10})$/.test(value)) {
      setPhoneError('Phone number must start with +63 and have 10 digits after.');
    } else {
      setPhoneError('');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setPasswordError(
        'Password must be at least 8 characters and include an uppercase letter, number, and symbol.'
      );
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!acceptedTerms) {
      alert('You must accept the Terms and Conditions.');
      return;
    }
  
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
  
    if (passwordError || phoneError) {
      alert('Please fix the errors in the form.');
      return;
    }
  
    const { confirmPassword, ...rawData } = formData;
  
    // Normalize phone number (e.g., remove spaces)
    const cleanedPhoneNumber = rawData.phoneNumber?.replace(/\s+/g, '');
  
    const dataToSend = {
      ...rawData,
      phoneNumber: cleanedPhoneNumber,
    };
  
    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert(data.message);
        navigate('/');
      } else {
        alert(data.message || 'Something went wrong.');
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
          <img src={logo} alt="logo" className="logo" />
          <h2 className="signup-title">Create Account</h2>

          <form onSubmit={handleSubmit}>
            <input type="text" name="firstName" placeholder="First Name" className="signup-input" value={formData.firstName} onChange={handleChange} required />
            <input type="text" name="lastName" placeholder="Last Name" className="signup-input" value={formData.lastName} onChange={handleChange} required />
            <input type="email" name="email" placeholder="Email" className="signup-input" value={formData.email} onChange={handleChange} required />
            <input type="text" name="username" placeholder="Username" className="signup-input" value={formData.username} onChange={handleChange} required />

            {/* Password */}
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                className="signup-input"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <span onClick={togglePasswordVisibility} className="password-toggle-icon">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {passwordError && <p className="password-error">{passwordError}</p>}

            {/* Confirm Password */}
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm Password"
                className="signup-input"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <span onClick={toggleConfirmPasswordVisibility} className="password-toggle-icon">
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            {/* Phone Input */}
            <PhoneInput
              international
              defaultCountry="PH"
              value={formData.phoneNumber}
              onChange={handlePhoneChange}
              className="phone-input"
              placeholder="Enter phone number"
            />
            {phoneError && <p className="password-error">{phoneError}</p>}

            <select name="role" className="signup-input" value={formData.role} onChange={handleChange}>
              <option value="client">Client</option>
              <option value="designer">Designer</option>
              <option value="admin">Admin</option>
            </select>

            <div className="terms-checkbox">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                checked={acceptedTerms}
                onChange={handleChange}
              />
              <label htmlFor="terms">I accept the Terms and Conditions</label>
            </div>

            <button type="submit" className="signup-button">Sign Up</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
