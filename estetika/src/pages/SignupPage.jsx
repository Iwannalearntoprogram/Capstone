import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import logo from "../assets/images/logo-moss-2.png";
import marbleBg from "../assets/images/white-marble-bg.png";
import { SERVER_URL } from "../config/server";
import {
  normalizePhone,
  sanitizeNameInput,
  trimValue,
  validateEmail,
  validatePasswordConfirmation,
  validatePhilippinePhone,
  validateNameWithoutNumbers,
  validateStrongPassword,
  validateUsername,
} from "../utils/validation";

function SignupPage() {
  const navigate = useNavigate();
  const serverUrl = SERVER_URL;

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
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNameKeyDown = (event) => {
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  };

  const validateForm = (nextFormData = formData, nextAcceptedTerms = acceptedTerms) => {
    const nextErrors = {
      firstName: validateNameWithoutNumbers(nextFormData.firstName, "First name"),
      lastName: validateNameWithoutNumbers(nextFormData.lastName, "Last name"),
      email: validateEmail(nextFormData.email),
      username: validateUsername(nextFormData.username),
      password: validateStrongPassword(nextFormData.password),
      confirmPassword: validatePasswordConfirmation(
        nextFormData.password,
        nextFormData.confirmPassword
      ),
      phoneNumber: validatePhilippinePhone(nextFormData.phoneNumber),
      terms: nextAcceptedTerms
        ? ""
        : "You must accept the Terms and Conditions.",
    };

    setFormErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setAcceptedTerms(checked);
      setFormErrors((prev) => ({
        ...prev,
        terms: checked ? "" : "You must accept the Terms and Conditions.",
      }));
    } else {
      const normalizedValue =
        name === "firstName" || name === "lastName"
          ? sanitizeNameInput(value)
          : value;
      const nextFormData = {
        ...formData,
        [name]: normalizedValue,
      };
      setFormData(nextFormData);
      setSubmitError("");
      setFormErrors((prev) => ({
        ...prev,
        [name]:
          name === "firstName"
            ? validateNameWithoutNumbers(normalizedValue, "First name")
            : name === "lastName"
            ? validateNameWithoutNumbers(normalizedValue, "Last name")
            : name === "email"
            ? validateEmail(value)
            : name === "username"
            ? validateUsername(value)
            : name === "password"
            ? validateStrongPassword(value)
            : name === "confirmPassword"
            ? validatePasswordConfirmation(nextFormData.password, value)
            : "",
        ...(name === "password"
          ? {
              confirmPassword: nextFormData.confirmPassword
                ? validatePasswordConfirmation(
                    value,
                    nextFormData.confirmPassword
                  )
                : prev.confirmPassword,
            }
          : {}),
      }));
    }
  };

  const handlePhoneChange = (value) => {
    setFormData((prevData) => ({
      ...prevData,
      phoneNumber: value,
    }));
    setSubmitError("");
    setFormErrors((prev) => ({
      ...prev,
      phoneNumber: validatePhilippinePhone(value),
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validateForm()) {
      setSubmitError("Please fix the highlighted fields.");
      return;
    }

    const rawData = { ...formData };
    delete rawData.confirmPassword;
    const cleanedPhoneNumber = normalizePhone(rawData.phoneNumber);

    const dataToSend = {
      ...rawData,
      firstName: trimValue(rawData.firstName),
      lastName: trimValue(rawData.lastName),
      email: trimValue(rawData.email).toLowerCase(),
      username: trimValue(rawData.username),
      phoneNumber: cleanedPhoneNumber,
    };

    try {
      setIsSubmitting(true);
      const response = await fetch(`${serverUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/login");
      } else {
        setSubmitError(data.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("Error:", error);
      setSubmitError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${marbleBg})` }}
    >
      <div className="flex w-full max-w-4xl flex-col md:flex-row bg-white shadow-lg rounded-2xl overflow-hidden">
        <div className="flex flex-col items-center justify-center bg-[#1D3C34] text-white p-6 sm:p-8 md:w-1/2 min-h-40">
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

        <div className="flex flex-col items-center justify-center p-6 sm:p-8 md:w-1/2">
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
              onKeyDown={handleNameKeyDown}
              inputMode="text"
              autoComplete="given-name"
              required
            />
            {formErrors.firstName && (
              <p className="text-red-500 text-sm -mt-2 mb-4 px-2">
                {formErrors.firstName}
              </p>
            )}
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              className="w-full p-2 mb-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1D3C34]  placeholder-gray-500"
              value={formData.lastName}
              onChange={handleChange}
              onKeyDown={handleNameKeyDown}
              inputMode="text"
              autoComplete="family-name"
              required
            />
            {formErrors.lastName && (
              <p className="text-red-500 text-sm -mt-2 mb-4 px-2">
                {formErrors.lastName}
              </p>
            )}
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="w-full p-2 mb-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1D3C34]  placeholder-gray-500"
              value={formData.email}
              onChange={handleChange}
              required
            />
            {formErrors.email && (
              <p className="text-red-500 text-sm -mt-2 mb-4 px-2">
                {formErrors.email}
              </p>
            )}
            <input
              type="text"
              name="username"
              placeholder="Username"
              className="w-full p-2 mb-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1D3C34]  placeholder-gray-500"
              value={formData.username}
              onChange={handleChange}
              required
            />
            {formErrors.username && (
              <p className="text-red-500 text-sm -mt-2 mb-4 px-2">
                {formErrors.username}
              </p>
            )}

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
            {formErrors.password && (
              <p className="text-red-500 text-sm mb-4">{formErrors.password}</p>
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
            {formErrors.confirmPassword && (
              <p className="text-red-500 text-sm mb-4">
                {formErrors.confirmPassword}
              </p>
            )}

            {/* Phone Input */}
            <PhoneInput
              international
              defaultCountry="PH"
              value={formData.phoneNumber}
              onChange={handlePhoneChange}
              className="w-full p-2 mb-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1D3C34]"
              placeholder="Enter phone number"
            />
            {formErrors.phoneNumber && (
              <p className="text-red-500 text-sm mb-4">
                {formErrors.phoneNumber}
              </p>
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
            {formErrors.terms && (
              <p className="text-red-500 text-sm mb-4">{formErrors.terms}</p>
            )}
            {submitError && (
              <p className="text-red-500 text-sm mb-4">{submitError}</p>
            )}

            <button
              type="submit"
              className="w-full bg-[#1D3C34] text-white py-2 rounded-full hover:bg-[#16442A] transition disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing Up..." : "Sign Up"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
