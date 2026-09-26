import React, { useState, useEffect } from "react";
import api from "../services/api";
import AlertBanner from "../components/AlertBanner";

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    vehicleNumber: "",
    brand: "",
    model: "",
    fuelType: "Petrol",
    manufacturingYear: new Date().getFullYear(),
  });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch customer's vehicles
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/vehicles");
      setVehicles(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load vehicles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Auto-dismiss success alert
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      vehicleNumber: "",
      brand: "",
      model: "",
      fuelType: "Petrol",
      manufacturingYear: new Date().getFullYear(),
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const handleOpenEdit = (v) => {
    setEditingId(v._id);
    setFormData({
      vehicleNumber: v.vehicleNumber,
      brand: v.brand,
      model: v.model,
      fuelType: v.fuelType,
      manufacturingYear: v.manufacturingYear,
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
  };

  // Create or Update vehicle
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.vehicleNumber.trim() || !formData.brand.trim() || !formData.model.trim()) {
      setError("Please fill in all required vehicle details.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        vehicleNumber: formData.vehicleNumber.trim().toUpperCase(),
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        fuelType: formData.fuelType,
        manufacturingYear: Number(formData.manufacturingYear),
      };

      if (editingId) {
        await api.put(`/vehicles/${editingId}`, payload);
        setSuccess("Vehicle updated successfully.");
      } else {
        await api.post("/vehicles", payload);
        setSuccess("Vehicle added successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save vehicle details.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete vehicle
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this vehicle?")) return;

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");
      await api.delete(`/vehicles/${id}`);
      setSuccess("Vehicle removed successfully.");
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete vehicle.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>My Vehicles</h1>
          <p className="page-subtitle">Register and manage your vehicles for quick service booking.</p>
        </div>
        {!showForm && (
          <button onClick={handleOpenAdd} className="btn-primary">
            + Add New Vehicle
          </button>
        )}
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError("")} />
      <AlertBanner type="success" message={success} onClose={() => setSuccess("")} />

      {/* Add / Edit Form Card */}
      {showForm && (
        <div className="card form-card">
          <h3>{editingId ? "Edit Vehicle Details" : "Register New Vehicle"}</h3>
          <form onSubmit={handleSubmit} className="vehicle-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="vehicleNumber">Vehicle Registration Number *</label>
                <input
                  id="vehicleNumber"
                  name="vehicleNumber"
                  type="text"
                  placeholder="e.g. MH02AB1234"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="brand">Brand / Make *</label>
                <input
                  id="brand"
                  name="brand"
                  type="text"
                  placeholder="e.g. Hyundai, Honda, Tata"
                  value={formData.brand}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="model">Model *</label>
                <input
                  id="model"
                  name="model"
                  type="text"
                  placeholder="e.g. i20, City, Nexon"
                  value={formData.model}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="fuelType">Fuel Type *</label>
                <select
                  id="fuelType"
                  name="fuelType"
                  value={formData.fuelType}
                  onChange={handleChange}
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                  <option value="CNG">CNG</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="manufacturingYear">Manufacturing Year *</label>
                <input
                  id="manufacturingYear"
                  name="manufacturingYear"
                  type="number"
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  value={formData.manufacturingYear}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting && <span className="spinner"></span>}
                {submitting ? "Saving..." : editingId ? "Update Vehicle" : "Add Vehicle"}
              </button>
              <button type="button" onClick={handleCancel} className="btn-secondary" disabled={submitting}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vehicle List */}
      {loading ? (
        <div className="loading-state">
          <span className="spinner spinner-primary"></span> Loading your vehicles...
        </div>
      ) : vehicles.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">🚗</div>
          <h3>You haven't added any vehicles yet</h3>
          <p>Register your vehicle to schedule service appointments and track maintenance history.</p>
          {!showForm && (
            <button onClick={handleOpenAdd} className="btn-primary">
              + Register Your First Vehicle
            </button>
          )}
        </div>
      ) : (
        <div className="vehicles-grid">
          {vehicles.map((v) => (
            <div key={v._id} className="card vehicle-card">
              <div className="vehicle-card-header">
                <div>
                  <h4 className="vehicle-title">
                    {v.brand} {v.model}
                  </h4>
                  <span className="vehicle-plate">{v.vehicleNumber}</span>
                </div>
                <span className="badge badge-fuel">{v.fuelType}</span>
              </div>

              <div className="vehicle-details">
                <div className="detail-item">
                  <span className="detail-label">Year:</span>
                  <span className="detail-value">{v.manufacturingYear}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Added:</span>
                  <span className="detail-value">
                    {new Date(v.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="vehicle-card-actions">
                <button
                  onClick={() => handleOpenEdit(v)}
                  className="btn-outline-sm"
                  disabled={deletingId === v._id}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(v._id)}
                  className="btn-danger-sm"
                  disabled={deletingId === v._id}
                >
                  {deletingId === v._id ? "Removing..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Vehicles;
