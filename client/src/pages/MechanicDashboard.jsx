import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import AlertBanner from "../components/AlertBanner";
import BillingModal from "../components/BillingModal";
import TaskModal from "../components/TaskModal";
import InvoiceModal from "../components/InvoiceModal";

const MechanicDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [garageMechanics, setGarageMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

  // New skill input state
  const [newSkillInput, setNewSkillInput] = useState("");
  const [addingSkill, setAddingSkill] = useState(false);

  // Modals state
  const [billingBooking, setBillingBooking] = useState(null);
  const [taskBooking, setTaskBooking] = useState(null);
  const [viewInvoice, setViewInvoice] = useState(null);

  const fetchMechanicData = async () => {
    try {
      setLoading(true);
      setError("");

      const [profileRes, bookingsRes, tasksRes] = await Promise.all([
        api.get("/users/mechanic/profile"),
        api.get("/bookings"),
        api.get("/tasks/my-tasks"),
      ]);

      setProfile(profileRes.data);
      setBookings(bookingsRes.data || []);
      setMyTasks(tasksRes.data || []);

      // If lead mechanic, fetch garage mechanics for task assignment
      if (profileRes.data?.user?.primaryGarage?._id) {
        try {
          const garageRes = await api.get(`/api/garages/${profileRes.data.user.primaryGarage._id}`);
          setGarageMechanics(garageRes.data?.mechanics || []);
        } catch {
          // Non-critical if garage lookup fails
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load mechanic dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMechanicData();
  }, []);

  // Auto-dismiss success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Handle adding a new skill
  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;

    try {
      setAddingSkill(true);
      setError("");
      const currentSkills = profile?.user?.skills || [];
      const updatedList = [...currentSkills, newSkillInput.trim()];

      const res = await api.put("/users/mechanic/skills", { skills: updatedList });

      setProfile((prev) => ({
        ...prev,
        user: { ...prev.user, skills: res.data.skills },
      }));

      setNewSkillInput("");
      setSuccess("Skill added successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add skill.");
    } finally {
      setAddingSkill(false);
    }
  };

  // Update booking status directly
  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      setUpdatingId(bookingId);
      setError("");
      setSuccess("");

      const res = await api.patch(`/bookings/${bookingId}`, { status: newStatus });
      setSuccess(
        newStatus === "confirmed" || newStatus === "accepted"
          ? "Booking accepted and moved to active queue."
          : "Booking status updated."
      );

      setBookings((prev) => prev.map((b) => (b._id === bookingId ? res.data : b)));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update booking status.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Update task status
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await api.patch(`/tasks/${taskId}`, { status: newStatus });
      setMyTasks((prev) => prev.map((t) => (t._id === taskId ? res.data : t)));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update task status.");
    }
  };

  // Download Invoice PDF
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
      setError("Failed to download invoice PDF.");
    }
  };

  const isPendingMembership =
    profile?.user?.membershipStatus === "pending" ||
    (profile?.joinRequest && profile.joinRequest.status === "pending");

  const garageInfo = profile?.user?.primaryGarage || profile?.joinRequest?.garage;
  const isLead =
    profile?.user?.primaryGarage?.leadMechanic &&
    profile.user.primaryGarage.leadMechanic.toString() === user?.id?.toString();

  // KPI Calculations
  const totalCount = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "in_progress" || b.status === "accepted"
  ).length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;

  // Filtered Bookings
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "pending") return b.status === "pending";
    if (activeTab === "confirmed")
      return b.status === "confirmed" || b.status === "in_progress" || b.status === "accepted";
    if (activeTab === "completed") return b.status === "completed";
    return true;
  });

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ margin: 0 }}>Mechanic Service Station</h1>
            {isLead && <span className="badge badge-lead">⭐ Lead Mechanic</span>}
          </div>
          <p className="page-subtitle">
            Welcome back, {user?.name || "Mechanic"}! Manage assigned repair jobs, tasks, and billing.
          </p>
        </div>
        <button onClick={fetchMechanicData} className="btn-secondary" disabled={loading}>
          {loading ? <span className="spinner spinner-primary"></span> : "🔄"} Refresh Queue
        </button>
      </div>

      <AlertBanner type="success" message={success} onClose={() => setSuccess("")} />
      <AlertBanner type="error" message={error} onClose={() => setError("")} />

      {/* Pending Membership Notice Banner */}
      {isPendingMembership && (
        <div className="card pending-membership-banner" style={{ marginBottom: "20px" }}>
          <div className="pending-icon">⏳</div>
          <div>
            <h3>Join Request Pending Garage Approval</h3>
            <p>
              Your request to join <strong>{garageInfo?.name || "Garage"}</strong> (Code:{" "}
              <strong>{garageInfo?.referenceCode || "N/A"}</strong>) is awaiting review by the Garage Owner.
            </p>
            <small className="text-muted">
              Once the owner approves your application, your active service bookings and assigned tasks will populate automatically.
            </small>
          </div>
        </div>
      )}

      {/* User Info Bar */}
      <div className="user-profile-bar" style={{ marginBottom: "20px" }}>
        <div className="profile-item">
          <strong>Mechanic:</strong> {user?.name}
        </div>
        <div className="profile-item">
          <strong>Garage:</strong> {garageInfo?.name || "Unassigned"}
        </div>
        <div className="profile-item">
          <strong>Status:</strong>{" "}
          <span className={`badge ${isPendingMembership ? "badge-status-pending" : "badge-status-completed"}`}>
            ● {isPendingMembership ? "Pending Approval" : "Active Member"}
          </span>
        </div>
      </div>

      {/* Skills Management Card */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ margin: 0 }}>My Skills &amp; Specializations</h3>
            <p className="text-muted" style={{ margin: "4px 0 10px 0", fontSize: "0.9rem" }}>
              These skills help your garage owner assign you matching service bookings and repair tasks.
            </p>
            <div className="m-skills-tags">
              {(profile?.user?.skills || []).length === 0 ? (
                <span className="text-muted">No skills added yet. Add your first specialization below.</span>
              ) : (
                profile.user.skills.map((skill, sIdx) => (
                  <span key={sIdx} className="skill-chip">
                    🔧 {skill}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Add Skill Form */}
          <form onSubmit={handleAddSkill} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="e.g. EV Diagnostics, Suspension..."
              value={newSkillInput}
              onChange={(e) => setNewSkillInput(e.target.value)}
              className="form-control"
              style={{ minWidth: "220px" }}
              required
            />
            <button type="submit" className="btn-primary" disabled={addingSkill}>
              {addingSkill ? "Adding..." : "+ Add Skill"}
            </button>
          </form>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
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

      {/* Assigned Tasks Section */}
      <div className="card" style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <h3 style={{ margin: 0 }}>My Assigned Service Tasks ({myTasks.length})</h3>
            <p className="text-muted" style={{ margin: "2px 0 0 0", fontSize: "0.85rem" }}>
              Individual repair tasks assigned to you by the garage owner or lead mechanic.
            </p>
          </div>
        </div>

        {myTasks.length === 0 ? (
          <p className="text-muted" style={{ margin: "10px 0" }}>
            No individual service tasks are currently assigned to you.
          </p>
        ) : (
          <div className="tasks-grid-list">
            {myTasks.map((t) => (
              <div key={t._id} className="card task-item-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <strong>{t.title}</strong>
                    {t.description && (
                      <p className="text-muted" style={{ margin: "4px 0", fontSize: "0.85rem" }}>
                        {t.description}
                      </p>
                    )}
                    <small className="text-muted">
                      Vehicle: <strong>{t.booking?.vehicle?.brand} {t.booking?.vehicle?.model}</strong> (
                      {t.booking?.vehicle?.vehicleNumber}) | Customer: {t.booking?.customer?.name}
                    </small>
                  </div>
                  <span className={`badge ${
                    t.status === "completed"
                      ? "badge-status-completed"
                      : t.status === "in_progress"
                      ? "badge-status-confirmed"
                      : "badge-status-pending"
                  }`}>
                    {t.status}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                  {t.status === "pending" && (
                    <button
                      type="button"
                      className="btn-primary-sm"
                      onClick={() => handleUpdateTaskStatus(t._id, "in_progress")}
                    >
                      ▶ Start Working
                    </button>
                  )}
                  {t.status !== "completed" && (
                    <button
                      type="button"
                      className="btn-success-sm"
                      onClick={() => handleUpdateTaskStatus(t._id, "completed")}
                    >
                      ✓ Mark Completed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Tabs for Bookings */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Assigned Jobs ({totalCount})
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
        <div className="loading-state">
          <span className="spinner spinner-primary"></span> Loading job queue...
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">🔧</div>
          <h3>No service requests in this category</h3>
          <p>
            {activeTab === "pending"
              ? "No pending service requests need acceptance right now."
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
                <div className="booking-status-box">
                  <span className={`badge ${
                    b.status === "completed"
                      ? "badge-status-completed"
                      : b.status === "confirmed" || b.status === "in_progress"
                      ? "badge-status-confirmed"
                      : "badge-status-pending"
                  }`}>
                    ● {b.status}
                  </span>
                </div>
              </div>

              <div className="booking-grid">
                <div className="booking-detail">
                  <span className="b-label">👤 Customer:</span>
                  <span className="b-value">{b.customer?.name}</span>
                  {b.customer?.mobile && (
                    <small className="b-subtext">📞 {b.customer.mobile}</small>
                  )}
                </div>

                <div className="booking-detail">
                  <span className="b-label">🚗 Vehicle:</span>
                  <span className="b-value">
                    {b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : "Vehicle Details"}
                  </span>
                  {b.vehicle?.vehicleNumber && (
                    <small className="b-subtext">
                      Plate: <strong>{b.vehicle.vehicleNumber}</strong>
                    </small>
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

              {/* Status Action Buttons & Billing Integration */}
              <div className="mechanic-actions-bar" style={{ flexWrap: "wrap", gap: "8px" }}>
                {b.status === "pending" && (
                  <button
                    onClick={() => handleUpdateStatus(b._id, "confirmed")}
                    className="btn-primary"
                    disabled={updatingId === b._id}
                  >
                    {updatingId === b._id ? "Confirming..." : "✓ Accept & Confirm Booking"}
                  </button>
                )}

                {b.status !== "completed" && (
                  <>
                    <button
                      type="button"
                      className="btn-success"
                      onClick={() => setBillingBooking(b)}
                    >
                      🧾 Prepare / Finalize Service Bill
                    </button>

                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => setTaskBooking(b)}
                    >
                      📋 Service Tasks
                    </button>
                  </>
                )}

                {b.status === "completed" && (
                  <>
                    <button
                      type="button"
                      className="btn-primary-sm"
                      onClick={async () => {
                        try {
                          const res = await api.get(`/api/invoices/booking/${b._id}`);
                          setViewInvoice(res.data);
                        } catch {
                          setError("Invoice details could not be retrieved.");
                        }
                      }}
                    >
                      📄 View Bill Details
                    </button>
                    <button
                      type="button"
                      className="btn-secondary-sm"
                      onClick={async () => {
                        try {
                          const res = await api.get(`/api/invoices/booking/${b._id}`);
                          handleDownloadInvoice(res.data._id, res.data.invoiceNumber);
                        } catch {
                          setError("Failed to download PDF.");
                        }
                      }}
                    >
                      ⬇️ Download PDF Invoice
                    </button>
                  </>
                )}

                <span className="booking-id" style={{ marginLeft: "auto", alignSelf: "center" }}>
                  ID: {b._id}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Billing Modal */}
      {billingBooking && (
        <BillingModal
          booking={billingBooking}
          onClose={() => setBillingBooking(null)}
          onSuccess={(savedInvoice, finalized) => {
            setSuccess(
              finalized
                ? "Bill finalized and service marked as completed."
                : "Draft bill saved successfully."
            );
            fetchMechanicData();
          }}
        />
      )}

      {/* Task Modal */}
      {taskBooking && (
        <TaskModal
          booking={taskBooking}
          mechanics={garageMechanics}
          canCreateTask={isLead}
          onClose={() => setTaskBooking(null)}
        />
      )}

      {/* View Invoice Modal */}
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

export default MechanicDashboard;
