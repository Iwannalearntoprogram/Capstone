import React, { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import logo from "../assets/images/logo-moss-2.png";
import marbleBg from "../assets/images/white-marble-bg.png";
import { useAuthStore } from "../store/AuthStore";
import axios from "axios";
import Cookies from "js-cookie";
import { FaEye, FaEyeSlash } from "react-icons/fa";

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
  const [showPassword, setShowPassword] = useState(false);
  // Forgot password flow state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: enter new password, 2: enter OTP
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

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
      // Check if user is archived
      const user = result.user || (result.data && result.data.user);
      console.log("User data:", user);
      if (user && user.isArchived) {
        alert("You are currently archived. Please contact the admins.");
        return;
      }

      const recentlyVerified = checkRecentVerification();

      if (recentlyVerified) {
        setIsSkippingOtp(true);
        await handleDirectAuthentication();
      } else {
        handleSendOtp();
        setShowOtpModal(true);
      }
    } else {
      const status = result?.error?.response?.status;
      const backendMsg = result?.error?.response?.data?.message;

      if (
        status === 400 ||
        status === 404 ||
        backendMsg === "Invalid credentials" ||
        backendMsg === "User not found"
      ) {
        setError("Incorrect email or password.");
      } else if (!result?.error?.response) {
        setError("Unable to connect to the server. Please try again.");
      } else {
        setError(backendMsg || "Something went wrong. Please try again.");
      }
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

        navigate("/dashboard/home", { replace: true });
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
        navigate("/dashboard/home", { replace: true });
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || "Invalid OTP. Try again.");
    }
  };

  // Forgot Password Handlers
  const resetForgotState = () => {
    setForgotStep(1);
    setNewPassword("");
    setConfirmNewPassword("");
    setForgotOtp("");
    setForgotError("");
    setForgotSuccess("");
    setForgotLoading(false);
  };

  const handleForgotInitiate = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    if (!formData.email) {
      setForgotError("Please enter your email above first.");
      return;
    }
    if (newPassword.length < 6) {
      setForgotError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotError("Passwords do not match.");
      return;
    }
    setForgotLoading(true);
    try {
      await axios.post(`${URL}/api/auth/forgot/initiate`, {
        email: formData.email,
        password: newPassword,
      });
      setForgotStep(2);
      setForgotSuccess("OTP sent to your email.");
    } catch (err) {
      setForgotError(
        err?.response?.data?.message || "Failed to initiate password reset."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotConfirm = async (e) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    if (!forgotOtp) {
      setForgotError("Enter the OTP sent to your email.");
      return;
    }
    setForgotLoading(true);
    try {
      await axios.post(`${URL}/api/auth/forgot/confirm`, {
        email: formData.email,
        otp: forgotOtp,
      });
      setForgotSuccess("Password reset successful. You can now log in.");
      // Prefill password field for convenience
      setFormData((prev) => ({ ...prev, password: newPassword }));
      setTimeout(() => {
        setShowForgotModal(false);
        resetForgotState();
      }, 1500);
    } catch (err) {
      setForgotError(err?.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${marbleBg})` }}
    >
      {/* OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 bg-opacity-40 z-50">
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
            <div className="mt-2 min-h-[20px]">
              {otpError && (
                <p className="text-red-500 text-sm" aria-live="polite">
                  {otpError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6 relative">
            <button
              type="button"
              onClick={() => {
                setShowForgotModal(false);
                resetForgotState();
              }}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <h2 className="text-xl font-semibold mb-4 text-[#1D3C34]">
              {forgotStep === 1 ? "Reset Password" : "Enter OTP"}
            </h2>
            {forgotStep === 1 && (
              <form onSubmit={handleForgotInitiate} className="space-y-4">
                <p className="text-sm text-gray-600">
                  Enter a new password for the email shown below. We'll send an
                  OTP to confirm.
                </p>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="Enter your email"
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                  />
                </div>
                {forgotError && (
                  <p className="text-red-500 text-sm" aria-live="polite">
                    {forgotError}
                  </p>
                )}
                {forgotSuccess && (
                  <p className="text-green-600 text-sm">{forgotSuccess}</p>
                )}
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-[#1D3C34] text-white py-2 rounded-full hover:bg-[#16442A] transition disabled:opacity-60"
                >
                  {forgotLoading ? "Sending OTP..." : "Send OTP"}
                </button>
              </form>
            )}
            {forgotStep === 2 && (
              <form onSubmit={handleForgotConfirm} className="space-y-4">
                <p className="text-sm text-gray-600">
                  Enter the OTP sent to{" "}
                  <span className="font-medium">{formData.email}</span>.
                </p>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-700">
                    OTP Code
                  </label>
                  <input
                    type="text"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="6-digit code"
                    required
                  />
                </div>
                {forgotError && (
                  <p className="text-red-500 text-sm" aria-live="polite">
                    {forgotError}
                  </p>
                )}
                {forgotSuccess && (
                  <p className="text-green-600 text-sm">{forgotSuccess}</p>
                )}
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleForgotInitiate}
                    disabled={forgotLoading}
                    className="text-xs text-gray-600 hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-[#1D3C34] text-white py-2 rounded-full hover:bg-[#16442A] transition disabled:opacity-60"
                >
                  {forgotLoading ? "Verifying..." : "Verify & Reset"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Back to Home Button */}
      <Link
        to="/"
        className="mb-6 text-sm text-gray-600 hover:text-[#1D3C34] hover:underline transition z-20"
      >
        ← Back to Home
      </Link>

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
            <div className="relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                className="w-full p-2 px-4 border border-gray-500 rounded-full"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showPassword ? (
                  <FaEyeSlash className="h-5 w-5 text-gray-500" />
                ) : (
                  <FaEye className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>
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
          <div className="mt-4 min-h-[20px]">
            {error && (
              <p className="text-red-500 text-sm" aria-live="polite">
                {error}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowForgotModal(true)}
            className="mt-4 text-sm text-gray-600 hover:underline"
          >
            Forgot Password?
          </button>
        </div>

        <div className="flex flex-col items-center justify-center bg-[#1D3C34] text-white p-8 md:w-1/2 rounded-r-lg">
          <p className="text-center mb-6">
            Log in and keep your projects moving forward!
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
