import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../services/api";
import AlertBanner from "../components/AlertBanner";
import InvoiceModal from "../components/InvoiceModal";

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewInvoice, setViewInvoice] = useState(null);
  const location = useLocation();
  const [success, setSuccess] = useState(
    location.state?.bookingCreated ? "Service booking created successfully." : ""
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

  // Auto-dismiss success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleDownloadInvoice = async (invoiceId, invoiceNumber) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/api/invoices/${invoiceId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${invoiceNumber || invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      setError("Failed to download PDF invoice.");
    }
  };

  const handleViewInvoice = async (bookingId) => {
    try {
      setError("");
      const res = await api.get(`/api/invoices/booking/${bookingId}`);
      setViewInvoice(res.data);
    } catch {
      setError("Invoice is not ready or could not be found.");
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "badge-status-pending";
      case "confirmed":
      case "accepted":
      case "in_progress":
        return "badge-status-confirmed";
      case "completed":
        return "badge-status-completed";
      case "rejected":
      case "cancelled":
        return "badge-status-cancelled";
      default:
        return "badge-status-default";
    }
  };

  // Filtered list
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "pending") return b.status === "pending";
    if (activeTab === "confirmed")
      return b.status === "confirmed" || b.status === "accepted" || b.status === "in_progress";
    if (activeTab === "completed") return b.status === "completed";
    return true;
  });

  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "accepted" || b.status === "in_progress"
  ).length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;

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

      <AlertBanner type="success" message={success} onClose={() => setSuccess("")} />
      <AlertBanner type="error" message={error} onClose={() => setError("")} />

      {/* Booking Filter Tabs */}
      {bookings.length > 0 && (
        <div className="tab-bar">
          <button
            className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Bookings ({bookings.length})
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
            Confirmed / In-Progress ({confirmedCount})
          </button>
          <button
            className={`tab-btn ${activeTab === "completed" ? "active" : ""}`}
            onClick={() => setActiveTab("completed")}
          >
            Completed ({completedCount})
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <span className="spinner spinner-primary"></span> Loading your service bookings...
        </div>
      ) : bookings.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">📅</div>
          <h3>You don't have any service bookings yet</h3>
          <p>Find a local garage to schedule your first vehicle maintenance or repair service.</p>
          <Link to="/garages" className="btn-primary">
            Explore Garages &amp; Book Service
          </Link>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No {activeTab} bookings found</h3>
          <p>There are no service bookings matching the "{activeTab}" status category.</p>
          <button onClick={() => setActiveTab("all")} className="btn-secondary">
            View All Bookings
          </button>
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
                    {b.vehicle
                      ? `${b.vehicle.brand} ${b.vehicle.model}`
                      : "Vehicle Details"}
                  </span>
                  {b.vehicle?.vehicleNumber && (
                    <small className="b-subtext">Plate: <strong>{b.vehicle.vehicleNumber}</strong></small>
                  )}
                </div>

                <div className="booking-detail">
                  <span className="b-label">📍 Garage:</span>
                  <span className="b-value">{b.garage?.name || "Service Center"}</span>
                  {b.garage?.address && (
                    <small className="b-subtext">{b.garage.address}</small>
                  )}
                </div>

                <div className="booking-detail">
                  <span className="b-label">⏰ Appointment Time:</span>
                  <span className="b-value">
                    {new Date(b.appointmentAt).toLocaleString([], {
                      weekday: "short",
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
                    {b.mechanic?.name || "Pending Assignment"}
                  </span>
                  {b.mechanic?.mobile && (
                    <small className="b-subtext">📞 {b.mechanic.mobile}</small>
                  )}
                </div>
              </div>

              {b.notes && (
                <div className="booking-notes">
                  <strong>Notes:</strong> {b.notes}
                </div>
              )}

              {/* Action Buttons for Invoices */}
              <div className="booking-footer" style={{ flexWrap: "wrap", gap: "10px" }}>
                <span className="booking-id">Booking ID: {b._id}</span>
                <span className="booking-date">
                  Booked on {new Date(b.createdAt).toLocaleDateString()}
                </span>

                {b.status === "completed" && (
                  <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="btn-primary-sm"
                      onClick={() => handleViewInvoice(b._id)}
                    >
                      📄 View Bill / Invoice
                    </button>
                    <button
                      type="button"
                      className="btn-secondary-sm"
                      onClick={async () => {
                        try {
                          const res = await api.get(`/api/invoices/booking/${b._id}`);
                          handleDownloadInvoice(res.data._id, res.data.invoiceNumber);
                        } catch {
                          setError("Invoice PDF is not yet available.");
                        }
                      }}
                    >
                      ⬇️ Download PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Viewer Modal */}
      {viewInvoice && (
        <InvoiceModal
          invoice={viewInvoice}
          onClose={() => setViewInvoice(null)}
          onDownload={handleDownloadInvoice}
        />
      )}
    </div>
  );
};

export default Bookings;
