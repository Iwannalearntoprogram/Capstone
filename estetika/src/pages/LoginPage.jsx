import React, { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import logo from "../assets/images/logo-moss-2.png";
import marbleBg from "../assets/images/white-marble-bg.png";
import { useAuthStore } from "../store/AuthStore";
import axios from "axios";
import Cookies from "js-cookie";

const URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [isSkippingOtp, setIsSkippingOtp] = useState(false);

  const navigate = useNavigate();
  const { login, token, setUserAndToken, checkRecentVerification } =
    useAuthStore();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await login(formData.email, formData.password, URL);

    setIsSubmitting(false);
    if (result.success) {
      const recentlyVerified = checkRecentVerification();

      if (recentlyVerified) {
        setIsSkippingOtp(true);
        await handleDirectAuthentication();
      } else {
        handleSendOtp();
        setShowOtpModal(true);
      }
    } else {
      setError(
        result.error?.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    }
  };

  const handleDirectAuthentication = async () => {
    try {
      const tempUser = Cookies.get("temp_user");
      const tempToken = Cookies.get("temp_token");
      const tempId = localStorage.getItem("temp_id");
      const tempRole = localStorage.getItem("temp_role");

      if (tempUser && tempToken && tempId && tempRole) {
        Cookies.set("user", tempUser, { expires: 1 });
        Cookies.set("token", tempToken, { expires: 1 });
        localStorage.setItem("id", tempId);
        localStorage.setItem("role", tempRole);

        Cookies.remove("temp_user");
        Cookies.remove("temp_token");
        localStorage.removeItem("temp_id");
        localStorage.removeItem("temp_role");

        setUserAndToken(JSON.parse(tempUser), tempToken);

        navigate("/home", { replace: true });
      }
    } catch (error) {
      console.error("Error in direct authentication:", error);
      setError("Authentication failed. Please try again.");
      setIsSkippingOtp(false);
    }
  };

  const handleSendOtp = async () => {
    try {
      await axios.post(`${URL}/api/auth/send-otp`, {
        email: formData.email,
      });
    } catch (error) {
      console.error("Error sending OTP:", error);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const response = await axios.post(`${URL}/api/auth/verify-otp`, {
        email: formData.email,
        otp: otpCode,
      });

      if (response.status === 200) {
        const tempUser = Cookies.get("temp_user");
        const tempToken = Cookies.get("temp_token");
        const tempId = localStorage.getItem("temp_id");
        const tempRole = localStorage.getItem("temp_role");

        if (tempUser && tempToken && tempId && tempRole) {
          Cookies.set("user", tempUser, { expires: 1 });
          Cookies.set("token", tempToken, { expires: 1 });
          localStorage.setItem("id", tempId);
          localStorage.setItem("role", tempRole);

          Cookies.remove("temp_user");
          Cookies.remove("temp_token");
          localStorage.removeItem("temp_id");
          localStorage.removeItem("temp_role");
        }
        useAuthStore.setState({
          user: JSON.parse(tempUser),
          token: tempToken,
        });

        setUserAndToken(JSON.parse(tempUser), tempToken);
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || "Invalid OTP. Try again.");
    } finally {
      navigate("/home", { replace: true });
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${marbleBg})` }}
    >
      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
            <h2 className="text-xl font-semibold mb-2">Enter OTP</h2>
            <p className="text-sm mb-4">
              A code has been sent to your email. Please enter it below.
            </p>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="w-full p-2 border border-gray-400 rounded mb-3"
              placeholder="Enter OTP"
            />
            <button
              onClick={handleVerifyOtp}
              className="w-full bg-[#1D3C34] text-white py-2 rounded-full hover:bg-[#16442A] transition"
            >
              Verify OTP
            </button>
            {otpError && <p className="text-red-500 mt-2">{otpError}</p>}
          </div>
        </div>
      )}

      {/* Login UI */}
      <div className="flex flex-col md:flex-row shadow-lg rounded-lg overflow-hidden max-w-4xl z-10">
        <div className="flex flex-col items-center justify-center p-12 md:w-1/2 bg-white shadow-md rounded-l-lg">
          <div className="mb-8">
            <img src={logo} alt="logo" className="h-16 w-auto mx-auto" />
          </div>
          <h2 className="text-2xl font-semibold text-[#1D3C34] mb-8">
            Welcome Back!
          </h2>
          <form onSubmit={handleLogin} className="w-full max-w-sm">
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="w-full p-2 px-4 mb-4 border border-gray-500 rounded-full"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="w-full p-2 px-4 mb-4 border border-gray-500 rounded-full"
              value={formData.password}
              onChange={handleChange}
              required
            />{" "}
            <button
              type="submit"
              className="mb-8 w-full bg-[#1D3C34] text-white py-2 rounded-full hover:bg-[#16442A] transition"
              disabled={isSubmitting || isSkippingOtp}
            >
              {isSubmitting
                ? "Logging in..."
                : isSkippingOtp
                ? "Authenticating..."
                : "Login"}
            </button>
          </form>
          {error && <p className="text-red-500 mt-4">{error}</p>}
          <p className="mt-4 text-sm text-gray-600 hover:underline cursor-pointer">
            Forgot Password?
          </p>
        </div>

        <div className="flex flex-col items-center justify-center bg-[#1D3C34] text-white p-8 md:w-1/2 rounded-r-lg">
          <h2 className="text-2xl font-semibold mb-4">New Here?</h2>
          <p className="text-center mb-6">
            Create an account and discover a smarter way to plan, track, and
            collaborate!
          </p>
          <Link to="/signup">
            <button className="font-semibold bg-white text-[#1D3C34] py-2 px-6 w-full rounded-full hover:bg-gray-200 transition">
              Sign Up
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
