import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import logo from "../assets/images/logo-moss-2.png";
import marbleBg from "../assets/images/white-marble-bg.png";

function SignupPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    role: "client",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setAcceptedTerms(checked);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));

      if (name === "password") {
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
      setPhoneError(
        "Phone number must start with +63 and have 10 digits after."
      );
    } else {
      setPhoneError("");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const validatePassword = (password) => {
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setPasswordError(
        "Password must be at least 8 characters and include an uppercase letter, number, and symbol."
      );
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!acceptedTerms) {
      alert("You must accept the Terms and Conditions.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (passwordError || phoneError) {
      alert("Please fix the errors in the form.");
      return;
    }

    const { confirmPassword, ...rawData } = formData;

    const cleanedPhoneNumber = rawData.phoneNumber?.replace(/\s+/g, "");

    const dataToSend = {
      ...rawData,
      phoneNumber: cleanedPhoneNumber,
    };

    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        navigate("/");
      } else {
        alert(data.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${marbleBg})` }}
    >
      <div className="flex flex-col md:flex-row bg-white shadow-lg rounded-lg overflow-hidden max-w-4xl">
        <div className="flex flex-col items-center justify-center bg-[#1D3C34] text-white p-8 md:w-1/2 rounded-l-lg">
          <h2 className="text-2xl font-semibold mb-4">Welcome Back!</h2>
          <p className="text-center mb-6">
            Log in and keep your projects moving forward!
          </p>
          <Link to="/">
            <button className="font-semibold bg-white text-[#1D3C34] py-2 px-6 rounded-full hover:bg-gray-200 transition">
              Log In
            </button>
          </Link>
        </div>

        <div className="flex flex-col items-center justify-center p-8 md:w-1/2">
          <img src={logo} alt="logo" className="h-16 w-auto mb-4" />
          <h2 className="text-2xl font-semibold text-[#1D3C34] mb-4">
            Create Account
          </h2>

          <form onSubmit={handleSubmit} className="w-full max-w-sm">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              className="w-full p-2 mb-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1D3C34]  placeholder-gray-500"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              className="w-full p-2 mb-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1D3C34]  placeholder-gray-500"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="w-full p-2 mb-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1D3C34]  placeholder-gray-500"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="username"
              placeholder="Username"
              className="w-full p-2 mb-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1D3C34]  placeholder-gray-500"
              value={formData.username}
              onChange={handleChange}
              required
            />

            {/* Password */}
            <div className="relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                className="w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1D3C34] placeholder-gray-500"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <span
                onClick={togglePasswordVisibility}
                className="absolute top-1/2 right-4 transform -translate-y-1/2 cursor-pointer text-gray-500"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {passwordError && (
              <p className="text-red-500 text-sm mb-4">{passwordError}</p>
            )}

            {/* Confirm Password */}
            <div className="relative mb-4">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                className="w-full p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <span
                onClick={toggleConfirmPasswordVisibility}
                className="absolute top-1/2 right-4 transform -translate-y-1/2 cursor-pointer text-gray-500"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            {/* Phone Input */}
            <PhoneInput
              international
              defaultCountry="PH"
              value={formData.phoneNumber}
              onChange={handlePhoneChange}
              className="w-full p-2 mb-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
              placeholder="Enter phone number"
            />
            {phoneError && (
              <p className="text-red-500 text-sm mb-4">{phoneError}</p>
            )}

            <select
              name="role"
              className="w-full p-2 mb-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="client">Client</option>
              <option value="designer">Designer</option>
              <option value="admin">Admin</option>
            </select>

            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                checked={acceptedTerms}
                onChange={handleChange}
                className="mr-2"
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I accept the Terms and Conditions
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-[#1D3C34] text-white py-2 rounded-full hover:bg-[#16442A] transition"
            >
              Sign Up
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
