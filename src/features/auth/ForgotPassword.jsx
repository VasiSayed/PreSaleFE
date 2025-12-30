// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import api from "../../api/axiosInstance";

// export default function ForgotPassword() {
//   const nav = useNavigate();
//   const [form, setForm] = useState({
//     email: "",
//     password: "",
//     confirm_password: "",
//   });
//   const [error, setError] = useState("");
//   const [msg, setMsg] = useState("");

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//     setError("");
//   };

//   const submit = async (e) => {
//     e.preventDefault();
//     try {
//       await api.post("/accounts/password/direct-reset/", form);
//       setMsg("Password reset successful. Please login.");
//       setTimeout(() => nav("/login"), 1500);
//     } catch (err) {
//       setError(err.response?.data?.detail || "Failed to reset password");
//     }
//   };

//   return (
//     <form onSubmit={submit} style={{ maxWidth: 400, margin: "auto" }}>
//       <h2>Reset Password</h2>

//       <input
//         type="email"
//         name="email"
//         placeholder="Enter your email"
//         value={form.email}
//         onChange={handleChange}
//         required
//       />

//       <input
//         type="password"
//         name="password"
//         placeholder="New password"
//         value={form.password}
//         onChange={handleChange}
//         required
//       />

//       <input
//         type="password"
//         name="confirm_password"
//         placeholder="Confirm password"
//         value={form.confirm_password}
//         onChange={handleChange}
//         required
//       />

//       <button type="submit">Reset Password</button>

//       {error && <p style={{ color: "red" }}>{error}</p>}
//       {msg && <p style={{ color: "green" }}>{msg}</p>}
//     </form>
//   );
// }

// src/features/auth/ForgotPassword.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Header/Navbar";
import Footer from "../Footer/Footer";
import profileImg from "../../assets/profile.jpg";
import api from "../../api/axiosInstance";
import "./Auth.css"; // ✅ SAME CSS

// Icons (same pattern as Auth.jsx)
const MailIcon = ({ size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const LockIcon = ({ size = 24 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export default function ForgotPassword() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm_password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // branding (simple – same logo/title)
  const brandLogo = profileImg;
  const brandName = "myciti.life";

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    try {
      await api.post("/accounts/password/direct-reset/", form);
      setSuccess("Password reset successful. Redirecting to login...");
      setTimeout(() => nav("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to reset password");
    }
  };

  return (
    <div className="auth-page">
      <Navbar showLogout={false} />

      <div className="auth-container">
        <div className="auth-background">
          <div className="auth-card">
            {/* ===== Header ===== */}
            <div className="auth-header">
              <div className="auth-logo">
                <img
                  src={brandLogo}
                  alt={brandName}
                  className="logo-image"
                />
              </div>
              <h1 className="auth-title">{brandName}</h1>
              <p className="auth-subtitle">
                Reset your account password
              </p>
            </div>

            {/* ===== Form ===== */}
            <form className="auth-form" onSubmit={submit}>
              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <MailIcon size={20} />
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="input-wrapper">
                  <LockIcon size={20} />
                  <input
                    type="password"
                    name="password"
                    className="form-input"
                    placeholder="Enter new password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="input-wrapper">
                  <LockIcon size={20} />
                  <input
                    type="password"
                    name="confirm_password"
                    className="form-input"
                    placeholder="Confirm new password"
                    value={form.confirm_password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && (
                <div
                  className="error-message"
                  style={{ background: "#ecfeff", color: "#0369a1", borderColor: "#bae6fd" }}
                >
                  {success}
                </div>
              )}

              <button type="submit" className="submit-btn">
                Reset Password
              </button>

              <div className="auth-toggle">
                <p>
                  Back to
                  <button
                    type="button"
                    className="toggle-btn"
                    onClick={() => nav("/login")}
                  >
                    Login
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
