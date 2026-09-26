import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const MechanicDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

  // Fetch bookings available to mechanic
  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/bookings");
      setBookings(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load mechanic bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Update booking status (pending -> confirmed -> completed)
  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      setUpdatingId(bookingId);
      setError("");
      setSuccess("");

      const res = await api.patch(`/bookings/${bookingId}`, {
        status: newStatus,
      });

      const updated = res.data;
      setSuccess(
        newStatus === "confirmed"
          ? `Booking #${bookingId.slice(-6)} confirmed successfully!`
          : `Service for Booking #${bookingId.slice(-6)} marked as completed!`
      );

      // Update local state with updated booking
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? updated : b))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update booking status.");
    } finally {
      setUpdatingId(null);
    }
  };

  // KPI Calculations from real backend data
  const totalCount = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;

  // Filtered bookings based on tab
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "pending") return b.status === "pending";
    if (activeTab === "confirmed") return b.status === "confirmed";
    if (activeTab === "completed") return b.status === "completed";
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <span className="badge badge-status-pending">● Pending Acceptance</span>;
      case "confirmed":
        return <span className="badge badge-status-confirmed">● Confirmed / In Progress</span>;
      case "completed":
        return <span className="badge badge-status-completed">✓ Service Completed</span>;
      default:
        return <span className="badge badge-status-default">{status}</span>;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Mechanic Service Station</h1>
          <p className="page-subtitle">
            Welcome back, {user?.name || "Mechanic"}! Manage assigned repair jobs and update service progress.
          </p>
        </div>
        <button onClick={fetchBookings} className="btn-secondary" disabled={loading}>
          🔄 Refresh Bookings
        </button>
      </div>

      <div className="user-profile-bar">
        <div className="profile-item">
          <strong>Mechanic:</strong> {user?.name}
        </div>
        <div className="profile-item">
          <strong>Email:</strong> {user?.email}
        </div>
        <div className="profile-item">
          <strong>Phone:</strong> {user?.mobile}
        </div>
        <div className="profile-item">
          <strong>Role:</strong> <span className="badge badge-mechanic">{user?.role}</span>
        </div>
      </div>

      {/* Real-data KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => setActiveTab("all")} style={{ cursor: "pointer" }}>
          <span className="stat-number">{loading ? "..." : totalCount}</span>
          <span className="stat-title">Total Job Requests</span>
        </div>
        <div className="stat-card" onClick={() => setActiveTab("pending")} style={{ cursor: "pointer" }}>
          <span className="stat-number stat-highlight">{loading ? "..." : pendingCount}</span>
          <span className="stat-title">Pending Acceptance</span>
        </div>
        <div className="stat-card" onClick={() => setActiveTab("confirmed")} style={{ cursor: "pointer" }}>
          <span className="stat-number" style={{ color: "var(--primary)" }}>
            {loading ? "..." : confirmedCount}
          </span>
          <span className="stat-title">Active Services</span>
        </div>
        <div className="stat-card" onClick={() => setActiveTab("completed")} style={{ cursor: "pointer" }}>
          <span className="stat-number" style={{ color: "var(--success)" }}>
            {loading ? "..." : completedCount}
          </span>
          <span className="stat-title">Completed Services</span>
        </div>
      </div>

      {/* Alerts */}
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Filter Tabs */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Bookings ({totalCount})
        </button>
        <button
          className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          Pending ({pendingCount})
        </button>
        <button
          className={`tab-btn ${activeTab === "confirmed" ? "active" : ""}`}
          onClick={() => setActiveTab("confirmed")}
        >
          Active / Confirmed ({confirmedCount})
        </button>
        <button
          className={`tab-btn ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Booking List */}
      {loading ? (
        <div className="loading-state">Loading job queue...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">🔧</div>
          <h3>No Bookings in this Category</h3>
          <p>
            {activeTab === "pending"
              ? "No pending service requests require confirmation right now."
              : activeTab === "confirmed"
              ? "No jobs are currently in-progress."
              : activeTab === "completed"
              ? "No finished jobs in history yet."
              : "No booking requests found for your assigned garage."}
          </p>
        </div>
      ) : (
        <div className="bookings-list">
          {filteredBookings.map((b) => (
            <div key={b._id} className="card booking-card">
              <div className="booking-card-top">
                <div className="booking-main-info">
                  <span className="booking-service-name">
                    {b.service?.name || "Vehicle Service"}
                  </span>
                  <span className="booking-price">₹{b.service?.price || 0}</span>
                </div>
                <div className="booking-status-box">{getStatusBadge(b.status)}</div>
              </div>

              <div className="booking-grid">
                <div className="booking-detail">
                  <span className="b-label">👤 Customer:</span>
                  <span className="b-value">{b.customer?.name || "Customer"}</span>
                  {b.customer?.mobile && (
                    <small className="b-subtext">📞 {b.customer.mobile}</small>
                  )}
                  {b.customer?.email && (
                    <small className="b-subtext">✉️ {b.customer.email}</small>
                  )}
                </div>

                <div className="booking-detail">
                  <span className="b-label">🚗 Vehicle:</span>
                  <span className="b-value">
                    {b.vehicle
                      ? `${b.vehicle.brand} ${b.vehicle.model}`
                      : "Vehicle Details"}
                  </span>
                  {b.vehicle?.vehicleNumber && (
                    <small className="b-subtext">
                      Plate: <strong>{b.vehicle.vehicleNumber}</strong>
                    </small>
                  )}
                  {b.vehicle?.fuelType && (
                    <small className="b-subtext">Fuel: {b.vehicle.fuelType}</small>
                  )}
                </div>

                <div className="booking-detail">
                  <span className="b-label">⏰ Appointment Time:</span>
                  <span className="b-value">
                    {new Date(b.appointmentAt).toLocaleString([], {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="booking-detail">
                  <span className="b-label">📍 Garage:</span>
                  <span className="b-value">{b.garage?.name || "Garage"}</span>
                  {b.garage?.address && (
                    <small className="b-subtext">{b.garage.address}</small>
                  )}
                </div>
              </div>

              {b.notes && (
                <div className="booking-notes">
                  <strong>Customer Instructions / Symptoms:</strong> {b.notes}
                </div>
              )}

              {/* Status Action Buttons */}
              <div className="mechanic-actions-bar">
                {b.status === "pending" && (
                  <button
                    onClick={() => handleUpdateStatus(b._id, "confirmed")}
                    className="btn-primary"
                    disabled={updatingId === b._id}
                  >
                    {updatingId === b._id ? "Confirming..." : "✓ Accept & Confirm Booking"}
                  </button>
                )}

                {b.status === "confirmed" && (
                  <button
                    onClick={() => handleUpdateStatus(b._id, "completed")}
                    className="btn-success"
                    disabled={updatingId === b._id}
                  >
                    {updatingId === b._id ? "Completing..." : "✓ Mark Service as Completed"}
                  </button>
                )}

                {b.status === "completed" && (
                  <div className="completed-tag">
                    <span>✅ Service Completed &amp; Customer Invoiced</span>
                  </div>
                )}

                <span className="booking-id" style={{ marginLeft: "auto", alignSelf: "center" }}>
                  ID: {b._id}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MechanicDashboard;
