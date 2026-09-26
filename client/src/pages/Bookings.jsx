import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../services/api";

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();
  const [success, setSuccess] = useState(
    location.state?.bookingCreated ? "Service appointment booked successfully!" : ""
  );

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/bookings");
      setBookings(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "badge-status-pending";
      case "confirmed":
        return "badge-status-confirmed";
      case "completed":
        return "badge-status-completed";
      case "cancelled":
        return "badge-status-cancelled";
      default:
        return "badge-status-default";
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>My Service Bookings</h1>
          <p className="page-subtitle">Track the status of your upcoming and past service appointments.</p>
        </div>
        <Link to="/garages" className="btn-primary">
          + Book New Service
        </Link>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading your service bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">📅</div>
          <h3>No Bookings Yet</h3>
          <p>You haven't scheduled any service appointments yet. Find a local garage to book your first service.</p>
          <Link to="/garages" className="btn-primary">
            Explore Garages &amp; Book Service
          </Link>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((b) => (
            <div key={b._id} className="card booking-card">
              <div className="booking-card-top">
                <div className="booking-main-info">
                  <span className="booking-service-name">
                    {b.service?.name || "Vehicle Service"}
                  </span>
                  <span className="booking-price">₹{b.service?.price || 0}</span>
                </div>
                <div className="booking-status-box">
                  <span className={`badge ${getStatusBadgeClass(b.status)}`}>
                    ● {b.status}
                  </span>
                </div>
              </div>

              <div className="booking-grid">
                <div className="booking-detail">
                  <span className="b-label">🚗 Vehicle:</span>
                  <span className="b-value">
                    {b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model} (${b.vehicle.vehicleNumber})` : "Vehicle Details"}
                  </span>
                </div>

                <div className="booking-detail">
                  <span className="b-label">📍 Garage:</span>
                  <span className="b-value">
                    {b.garage ? b.garage.name : "Service Center"}
                    {b.garage?.address && <small className="b-subtext">{b.garage.address}</small>}
                  </span>
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
                  <span className="b-label">👨‍🔧 Assigned Mechanic:</span>
                  <span className="b-value">
                    {b.mechanic ? b.mechanic.name : "Pending Assignment"}
                    {b.mechanic?.mobile && <small className="b-subtext">Phone: {b.mechanic.mobile}</small>}
                  </span>
                </div>
              </div>

              {b.notes && (
                <div className="booking-notes">
                  <strong>Notes:</strong> {b.notes}
                </div>
              )}

              <div className="booking-footer">
                <span className="booking-id">Booking ID: {b._id}</span>
                <span className="booking-date">
                  Booked on {new Date(b.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookings;
