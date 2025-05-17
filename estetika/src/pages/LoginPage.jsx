import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import logo from "../assets/images/logo-moss-2.png";
import marbleBg from "../assets/images/white-marble-bg.png";

function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState("");

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

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("id", data.user.id);
        localStorage.setItem("role", data.user.role);
        setIsLoggedIn(true);
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  if (isLoggedIn) {
    return <Navigate to="/home" />;
  }

  return (
    <div
      className="flex flex-col items-center justify-center h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${marbleBg})` }}
    >
      <div className="flex flex-col md:flex-row shadow-lg rounded-lg overflow-hidden max-w-4xl">
        <div className="flex flex-col items-center justify-center p-12 md:w-1/2 bg-white shadow-md rounded-l-lg">
          <div className="mb-8">
            <img
              src={logo}
              alt="logo"
              className="h-16 w-auto mx-auto object-contain"
            />
          </div>
          <h2 className="text-2xl font-semibold text-[#1D3C34] mb-8">
            Welcome Back!
          </h2>
          <form onSubmit={handleLogin} className="w-full max-w-sm">
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="w-full p-2 px-4 mb-4 border border-gray-500 rounded-full focus:outline-none  placeholder-gray-500"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="w-full p-2 px-4 mb-4 border border-gray-500 rounded-full focus:outline-none  placeholder-gray-500"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button
              type="submit"
              className="mb-8 w-full bg-[#1D3C34] text-white py-2 rounded-full hover:bg-[#16442A] transition"
            >
              Login
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
