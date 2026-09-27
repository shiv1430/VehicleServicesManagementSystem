import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AlertBanner from "../components/AlertBanner";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    role: "customer",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim() || !formData.email.trim() || !formData.mobile.trim() || !formData.password) {
      setError("All fields are required.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    try {
      setSubmitting(true);
      const user = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        password: formData.password,
        role: formData.role,
      });

      // Redirect to appropriate dashboard
      if (user.role === "mechanic" || user.role === "garage_owner") {
        navigate("/mechanic-dashboard");
      } else {
        navigate("/customer-dashboard");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Registration failed. An account with this email may already exist.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join SmartAuto Service Platform</p>
        </div>

        <AlertBanner type="error" message={error} onClose={() => setError("")} />

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="e.g. rahul@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="mobile">Mobile Number</label>
            <input
              id="mobile"
              name="mobile"
              type="tel"
              placeholder="e.g. 9876543210"
              value={formData.mobile}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password (min 8 characters)</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Create a secure password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">I am registering as</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="customer">Vehicle Owner (Customer)</option>
              <option value="mechanic">Mechanic / Service Provider</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting && <span className="spinner"></span>}
            {submitting ? "Creating Account..." : "Register"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
