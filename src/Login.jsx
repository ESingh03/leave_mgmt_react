import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ React Router
import "./Login.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // ✅ For programmatic navigation

  const handleLogin = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:3000/leave_mgmt/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) throw new Error("Invalid credentials");

      const data = await response.json();
      localStorage.setItem("departmentName", data.departmentName);

      // ✅ Navigate to the React Dashboard route
      navigate("/dashboard");
    } catch (err) {
      setMessage("Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Faculty Leave Management</h2>
        <div className="login-form">
          <label htmlFor="username" className="login-label">Username</label>
          <input
            id="username"
            type="text"
            className="login-input"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label htmlFor="password" className="login-label">Password</label>
          <input
            id="password"
            type="password"
            className="login-input"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="login-button"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {message && <p className="login-error">{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default Login;
