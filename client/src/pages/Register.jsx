import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AlertBanner from "../components/AlertBanner";

const PRESET_SKILLS = [
  "Engine Repair",
  "Brake Service",
  "Electrical & Battery",
  "AC Repair & Cooling",
  "Diagnostics & Tuning",
  "Suspension & Steering",
  "EV Maintenance",
  "Tyre & Wheel Alignment",
];

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    role: "customer",
    // Garage Owner specific fields
    garageName: "",
    garageAddress: "",
    garagePhone: "",
    garageDescription: "",
    // Mechanic specific fields
    garageCode: "",
  });

  const [selectedSkills, setSelectedSkills] = useState(["Engine Repair", "Brake Service"]);
  const [customSkill, setCustomSkill] = useState("");

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

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills((prev) => [...prev, customSkill.trim()]);
      setCustomSkill("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim() || !formData.email.trim() || !formData.mobile.trim() || !formData.password) {
      setError("Name, email, mobile, and password are required.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (formData.role === "garage_owner") {
      if (!formData.garageName.trim() || !formData.garageAddress.trim()) {
        setError("Garage Name and Address are required for Garage Owner registration.");
        return;
      }
    }

    if (formData.role === "mechanic") {
      if (!formData.garageCode.trim()) {
        setError("Garage Reference Code is required to join a garage.");
        return;
      }
      if (selectedSkills.length === 0) {
        setError("Please select or add at least one mechanic skill.");
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        mobile: formData.mobile.trim(),
        password: formData.password,
        role: formData.role,
        ...(formData.role === "garage_owner" && {
          garageName: formData.garageName.trim(),
          garageAddress: formData.garageAddress.trim(),
          garagePhone: formData.garagePhone.trim() || formData.mobile.trim(),
          garageDescription: formData.garageDescription.trim(),
        }),
        ...(formData.role === "mechanic" && {
          garageCode: formData.garageCode.trim().toUpperCase(),
          skills: selectedSkills,
        }),
      };

      const user = await register(payload);

      // Redirect to appropriate role dashboard
      if (user.role === "garage_owner") {
        navigate("/owner-dashboard");
      } else if (user.role === "mechanic") {
        navigate("/mechanic-dashboard");
      } else {
        navigate("/customer-dashboard");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Registration failed. An account with this email may already exist, or code is invalid.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: formData.role === "customer" ? "480px" : "620px" }}>
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join SmartAuto Service Platform</p>
        </div>

        <AlertBanner type="error" message={error} onClose={() => setError("")} />

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Role Selection Tabs */}
          <div className="form-group">
            <label htmlFor="role">Registering As</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-control"
            >
              <option value="customer">🚗 Vehicle Owner (Customer)</option>
              <option value="garage_owner">🏢 Garage Owner / Station Manager</option>
              <option value="mechanic">👨‍🔧 Mechanic / Service Specialist</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
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
            <label htmlFor="email">Email Address *</label>
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
            <label htmlFor="mobile">Mobile Number *</label>
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
            <label htmlFor="password">Password (min 8 characters) *</label>
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

          {/* Garage Owner Extra Fields */}
          {formData.role === "garage_owner" && (
            <div className="role-specific-section">
              <h4 style={{ margin: "16px 0 10px 0", color: "var(--primary)" }}>Garage Details</h4>

              <div className="form-group">
                <label htmlFor="garageName">Garage / Service Center Name *</label>
                <input
                  id="garageName"
                  name="garageName"
                  type="text"
                  placeholder="e.g. Apex Auto Care &amp; Performance"
                  value={formData.garageName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="garageAddress">Full Physical Address *</label>
                <input
                  id="garageAddress"
                  name="garageAddress"
                  type="text"
                  placeholder="e.g. 104 Main Ring Road, Industrial Area"
                  value={formData.garageAddress}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="garagePhone">Garage Contact Phone</label>
                <input
                  id="garagePhone"
                  name="garagePhone"
                  type="tel"
                  placeholder="Landline or mobile phone"
                  value={formData.garagePhone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="garageDescription">About Garage (Optional)</label>
                <textarea
                  id="garageDescription"
                  name="garageDescription"
                  rows={2}
                  placeholder="Specializations, equipment, or working hours..."
                  value={formData.garageDescription}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {/* Mechanic Extra Fields */}
          {formData.role === "mechanic" && (
            <div className="role-specific-section">
              <h4 style={{ margin: "16px 0 6px 0", color: "var(--primary)" }}>Garage Affiliation &amp; Skills</h4>

              <div className="form-group">
                <label htmlFor="garageCode">Garage Reference / Invite Code *</label>
                <input
                  id="garageCode"
                  name="garageCode"
                  type="text"
                  placeholder="e.g. GAR-9X2K7P"
                  value={formData.garageCode}
                  onChange={handleChange}
                  style={{ textTransform: "uppercase", fontWeight: "bold", letterSpacing: "1px" }}
                  required
                />
                <small className="text-muted" style={{ display: "block", marginTop: "4px" }}>
                  Ask your Garage Owner for their unique invite code.
                </small>
              </div>

              <div className="form-group">
                <label>Select Your Skills &amp; Specializations *</label>
                <div className="preset-skills-grid">
                  {PRESET_SKILLS.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        className={`chip-btn ${isSelected ? "chip-btn-active" : ""}`}
                        onClick={() => toggleSkill(skill)}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Skill Input */}
              <div className="form-group" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Add custom skill (e.g. Turbo Tuning)"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  className="form-control"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  className="btn-secondary"
                  style={{ whiteSpace: "nowrap" }}
                >
                  + Add
                </button>
              </div>

              {selectedSkills.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <small className="text-muted">Selected Skills ({selectedSkills.length}):</small>
                  <div className="m-skills-tags" style={{ marginTop: "6px" }}>
                    {selectedSkills.map((s, idx) => (
                      <span key={idx} className="skill-chip">
                        {s}{" "}
                        <span
                          style={{ cursor: "pointer", marginLeft: "4px" }}
                          onClick={() => toggleSkill(s)}
                        >
                          ✕
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: "10px" }}>
            {submitting && <span className="spinner"></span>}
            {submitting ? "Creating Account..." : "Complete Registration"}
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
