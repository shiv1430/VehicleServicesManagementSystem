import React, { useState, useEffect } from "react";
import api from "../services/api";
import AlertBanner from "../components/AlertBanner";
import AssignMechanicModal from "../components/AssignMechanicModal";
import TaskModal from "../components/TaskModal";
import BillingModal from "../components/BillingModal";
import InvoiceModal from "../components/InvoiceModal";

const GarageOwnerDashboard = () => {
  const [garage, setGarage] = useState(null);
  const [mechanics, setMechanics] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [activeTab, setActiveTab] = useState("bookings");
  const [skillSearch, setSkillSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  // Modals state
  const [assignModalBooking, setAssignModalBooking] = useState(null);
  const [taskModalBooking, setTaskModalBooking] = useState(null);
  const [billingModalBooking, setBillingModalBooking] = useState(null);
  const [viewInvoice, setViewInvoice] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [garagesRes, mechanicsRes, requestsRes, bookingsRes, invoicesRes] =
        await Promise.all([
          api.get("/garages/mine"),
          api.get("/garages/mine/mechanics"),
          api.get("/garages/mine/join-requests"),
          api.get("/bookings"),
          api.get("/api/invoices"),
        ]);

      if (garagesRes.data && garagesRes.data.length > 0) {
        setGarage(garagesRes.data[0]);
      }
      setMechanics(mechanicsRes.data || []);
      setJoinRequests(requestsRes.data || []);
      setBookings(bookingsRes.data || []);
      setInvoices(invoicesRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load garage dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Copy reference code to clipboard with visual feedback
  const handleCopyCode = () => {
    if (!garage?.referenceCode) return;
    navigator.clipboard.writeText(garage.referenceCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  // Join Request Actions
  const handleRespondRequest = async (requestId, action, makeLead = false) => {
    try {
      setError("");
      setSuccess("");
      await api.patch(`/garages/mine/join-requests/${requestId}`, { action, makeLead });
      setSuccess(`Mechanic request ${action === "accept" ? "accepted" : "rejected"} successfully.`);
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to respond to join request.");
    }
  };

  // Designate Lead Mechanic
  const handleSetLeadMechanic = async (mechanicId) => {
    try {
      setError("");
      await api.patch("/garages/mine/lead-mechanic", { mechanicId });
      setSuccess("Lead mechanic designation updated.");
      fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update lead mechanic.");
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

  // KPI Calculations
  const activeMechanicsCount = mechanics.length;
  const pendingRequestsCount = joinRequests.filter((r) => r.status === "pending").length;
  const activeBookingsCount = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "in_progress" || b.status === "accepted"
  ).length;
  const unassignedCount = bookings.filter((b) => !b.mechanic && b.status === "pending").length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;
  const totalRevenue = invoices.reduce((acc, inv) => acc + (inv.totalAmount || inv.total || 0), 0);

  // Skill filter for mechanics
  const filteredMechanics = mechanics.filter((m) => {
    if (!skillSearch.trim()) return true;
    const query = skillSearch.toLowerCase();
    return (m.skills || []).some((s) => s.toLowerCase().includes(query));
  });

  return (
    <div className="page-container">
      {/* Header Info Banner */}
      <div className="page-header" style={{ marginBottom: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ margin: 0 }}>{garage?.name || "My Garage"}</h1>
            {garage?.verified && <span className="badge badge-verified">Verified</span>}
          </div>
          <p className="page-subtitle" style={{ margin: "4px 0 0 0" }}>
            📍 {garage?.address || "Address"} {garage?.phone ? `| 📞 ${garage.phone}` : ""}
          </p>
        </div>

        <button onClick={fetchDashboardData} className="btn-secondary" disabled={loading}>
          {loading ? <span className="spinner spinner-primary"></span> : "🔄"} Refresh Dashboard
        </button>
      </div>

      <AlertBanner type="success" message={success} onClose={() => setSuccess("")} />
      <AlertBanner type="error" message={error} onClose={() => setError("")} />

      {/* Reference Code Card */}
      <div className="card reference-code-card">
        <div className="ref-card-content">
          <div>
            <span className="ref-card-title">GARAGE REFERENCE / INVITE CODE</span>
            <div className="ref-code-display">{garage?.referenceCode || "GAR-PENDING"}</div>
            <p className="ref-card-help">
              Provide this code to mechanics. They enter it during registration to send a join request to your garage.
            </p>
          </div>
          <button
            type="button"
            className={`btn-copy ${copiedCode ? "btn-copied" : ""}`}
            onClick={handleCopyCode}
          >
            {copiedCode ? "✓ Copied to Clipboard!" : "📋 Copy Code"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ marginTop: "16px" }}>
        <div
          className="stat-card"
          onClick={() => setActiveTab("mechanics")}
          style={{ cursor: "pointer" }}
        >
          <span className="stat-number">{loading ? "..." : activeMechanicsCount}</span>
          <span className="stat-title">Active Mechanics</span>
        </div>

        <div
          className="stat-card"
          onClick={() => setActiveTab("requests")}
          style={{ cursor: "pointer" }}
        >
          <span className="stat-number stat-highlight">
            {loading ? "..." : pendingRequestsCount}
          </span>
          <span className="stat-title">Pending Join Requests</span>
        </div>

        <div
          className="stat-card"
          onClick={() => setActiveTab("bookings")}
          style={{ cursor: "pointer" }}
        >
          <span className="stat-number" style={{ color: "var(--primary)" }}>
            {loading ? "..." : unassignedCount}
          </span>
          <span className="stat-title">Unassigned Bookings</span>
        </div>

        <div
          className="stat-card"
          onClick={() => setActiveTab("bookings")}
          style={{ cursor: "pointer" }}
        >
          <span className="stat-number" style={{ color: "var(--primary)" }}>
            {loading ? "..." : activeBookingsCount}
          </span>
          <span className="stat-title">Active Services</span>
        </div>

        <div
          className="stat-card"
          onClick={() => setActiveTab("bookings")}
          style={{ cursor: "pointer" }}
        >
          <span className="stat-number" style={{ color: "var(--success)" }}>
            {loading ? "..." : completedCount}
          </span>
          <span className="stat-title">Completed Services</span>
        </div>

        <div
          className="stat-card"
          onClick={() => setActiveTab("invoices")}
          style={{ cursor: "pointer" }}
        >
          <span className="stat-number" style={{ color: "var(--success)" }}>
            ₹{loading ? "..." : totalRevenue.toLocaleString()}
          </span>
          <span className="stat-title">Total Billed Revenue</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tab-bar" style={{ marginTop: "24px" }}>
        <button
          className={`tab-btn ${activeTab === "bookings" ? "active" : ""}`}
          onClick={() => setActiveTab("bookings")}
        >
          Bookings &amp; Assignments ({bookings.length})
        </button>

        <button
          className={`tab-btn ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          Join Requests {pendingRequestsCount > 0 && `(${pendingRequestsCount})`}
        </button>

        <button
          className={`tab-btn ${activeTab === "mechanics" ? "active" : ""}`}
          onClick={() => setActiveTab("mechanics")}
        >
          Mechanics &amp; Skill Search ({mechanics.length})
        </button>

        <button
          className={`tab-btn ${activeTab === "invoices" ? "active" : ""}`}
          onClick={() => setActiveTab("invoices")}
        >
          Invoices &amp; Revenue ({invoices.length})
        </button>
      </div>

      {/* TAB 1: BOOKINGS & ASSIGNMENTS */}
      {activeTab === "bookings" && (
        <div className="tab-content">
          {bookings.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-icon">📅</div>
              <h3>No bookings yet</h3>
              <p>Customers have not booked services at your garage yet.</p>
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
                        {b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : "Vehicle"}
                      </span>
                      {b.vehicle?.vehicleNumber && (
                        <small className="b-subtext">Plate: <strong>{b.vehicle.vehicleNumber}</strong></small>
                      )}
                    </div>

                    <div className="booking-detail">
                      <span className="b-label">⏰ Appointment:</span>
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
                        {b.mechanic ? b.mechanic.name : "Unassigned"}
                      </span>
                      {b.mechanic?.mobile && (
                        <small className="b-subtext">📞 {b.mechanic.mobile}</small>
                      )}
                    </div>
                  </div>

                  {b.notes && (
                    <div className="booking-notes">
                      <strong>Customer Notes:</strong> {b.notes}
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="mechanic-actions-bar" style={{ flexWrap: "wrap", gap: "8px" }}>
                    <button
                      type="button"
                      className="btn-primary-sm"
                      onClick={() => setAssignModalBooking(b)}
                    >
                      {b.mechanic ? "🔄 Reassign Mechanic" : "➕ Assign Mechanic"}
                    </button>

                    <button
                      type="button"
                      className="btn-outline-sm"
                      onClick={() => setTaskModalBooking(b)}
                    >
                      📋 Service Tasks
                    </button>

                    {b.status === "completed" ? (
                      <button
                        type="button"
                        className="btn-success-sm"
                        onClick={async () => {
                          try {
                            const res = await api.get(`/api/invoices/booking/${b._id}`);
                            setViewInvoice(res.data);
                          } catch {
                            setError("Invoice not found for this completed booking.");
                          }
                        }}
                      >
                        📄 View Invoice
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-secondary-sm"
                        onClick={() => setBillingModalBooking(b)}
                      >
                        🧾 Prepare Bill
                      </button>
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
      )}

      {/* TAB 2: PENDING JOIN REQUESTS */}
      {activeTab === "requests" && (
        <div className="tab-content">
          {joinRequests.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-icon">👥</div>
              <h3>No Pending Join Requests</h3>
              <p>When mechanics register using your reference code ({garage?.referenceCode}), their applications will appear here.</p>
            </div>
          ) : (
            <div className="join-requests-grid">
              {joinRequests.map((req) => (
                <div key={req._id} className="card request-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{req.mechanic?.name}</h3>
                      <p className="text-muted" style={{ margin: "4px 0" }}>
                        📞 {req.mechanic?.mobile} | ✉️ {req.mechanic?.email}
                      </p>
                      <small className="text-muted">
                        Requested on: {new Date(req.requestedAt).toLocaleDateString()}
                      </small>
                    </div>
                    <span className={`badge ${
                      req.status === "accepted"
                        ? "badge-status-completed"
                        : req.status === "rejected"
                        ? "badge-status-cancelled"
                        : "badge-status-pending"
                    }`}>
                      ● {req.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ margin: "14px 0" }}>
                    <span className="party-title">SUBMITTED SKILLS:</span>
                    <div className="m-skills-tags" style={{ marginTop: "6px" }}>
                      {(req.skills && req.skills.length > 0 ? req.skills : ["General Repair"]).map(
                        (skill, sIdx) => (
                          <span key={sIdx} className="skill-chip">
                            {skill}
                          </span>
                        )
                      )}
                    </div>
                  </div>

                  {req.status === "pending" && (
                    <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                      <button
                        type="button"
                        className="btn-success"
                        style={{ flex: 1 }}
                        onClick={() => handleRespondRequest(req._id, "accept")}
                      >
                        ✓ Accept Mechanic
                      </button>
                      <button
                        type="button"
                        className="btn-outline"
                        style={{ flex: 1 }}
                        onClick={() => handleRespondRequest(req._id, "accept", true)}
                        title="Accept and designate as lead mechanic"
                      >
                        ⭐ Accept as Lead
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleRespondRequest(req._id, "reject")}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MECHANICS & SKILL SEARCH */}
      {activeTab === "mechanics" && (
        <div className="tab-content">
          <div className="card search-card" style={{ marginBottom: "20px" }}>
            <div className="search-group">
              <label htmlFor="skillFilter">Filter Mechanics by Skill</label>
              <input
                id="skillFilter"
                type="text"
                placeholder="e.g. Brake, Engine, EV, Diagnostics, AC..."
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
              />
            </div>
            {skillSearch && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSkillSearch("")}
                style={{ marginTop: "10px" }}
              >
                Reset Search
              </button>
            )}
          </div>

          {filteredMechanics.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-icon">🔧</div>
              <h3>No mechanics found matching "{skillSearch}"</h3>
              <p>Try searching with another keyword or clear the filter.</p>
            </div>
          ) : (
            <div className="mechanics-grid">
              {filteredMechanics.map((m) => (
                <div key={m.id || m._id} className="card mechanic-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{m.name}</h3>
                      <p className="text-muted" style={{ margin: "4px 0" }}>
                        📞 {m.mobile} | ✉️ {m.email}
                      </p>
                    </div>
                    {m.isLead && <span className="badge badge-lead">⭐ Lead Mechanic</span>}
                  </div>

                  <div style={{ margin: "14px 0" }}>
                    <span className="party-title">SKILLS &amp; SPECIALIZATIONS:</span>
                    <div className="m-skills-tags" style={{ marginTop: "6px" }}>
                      {(m.skills || []).length === 0 ? (
                        <span className="text-muted" style={{ fontSize: "0.85rem" }}>
                          No specific skills listed
                        </span>
                      ) : (
                        (m.skills || []).map((skill, sIdx) => (
                          <span key={sIdx} className="skill-chip">
                            {skill}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mechanic-footer-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="text-muted">
                      Active Workload: <strong>{m.activeJobsCount || 0} active jobs</strong>
                    </span>

                    {m.isLead ? (
                      <button
                        type="button"
                        className="btn-secondary-sm"
                        onClick={() => handleSetLeadMechanic(null)}
                      >
                        Remove Lead
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-outline-sm"
                        onClick={() => handleSetLeadMechanic(m.id || m._id)}
                      >
                        Make Lead
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: INVOICES & REVENUE */}
      {activeTab === "invoices" && (
        <div className="tab-content">
          <div className="card" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0 }}>Garage Revenue Overview</h3>
              <p className="text-muted" style={{ margin: "4px 0 0 0" }}>
                Total Invoiced Amount: <strong>₹{totalRevenue.toLocaleString()}</strong> ({invoices.length} invoices generated)
              </p>
            </div>
          </div>

          {invoices.length === 0 ? (
            <div className="card empty-state">
              <div className="empty-icon">🧾</div>
              <h3>No Invoices Generated Yet</h3>
              <p>Once mechanics finalize service bills for completed bookings, official tax invoices will be listed here.</p>
            </div>
          ) : (
            <div className="card table-card" style={{ overflowX: "auto" }}>
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Mechanic</th>
                    <th>Date</th>
                    <th style={{ textAlign: "right" }}>Total (₹)</th>
                    <th style={{ textAlign: "center" }}>Status</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv._id}>
                      <td>
                        <strong>{inv.invoiceNumber || `INV-${String(inv._id).slice(-6).toUpperCase()}`}</strong>
                      </td>
                      <td>{inv.customer?.name || "Customer"}</td>
                      <td>
                        {inv.vehicle ? `${inv.vehicle.brand} ${inv.vehicle.model}` : "Vehicle"}
                      </td>
                      <td>{inv.mechanic?.name || "Assigned Team"}</td>
                      <td>{new Date(inv.finalizedAt || inv.createdAt).toLocaleDateString()}</td>
                      <td style={{ textAlign: "right", fontWeight: "bold" }}>
                        ₹{(inv.totalAmount || inv.total || 0).toFixed(2)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span className={`badge ${
                          inv.status === "finalized" ? "badge-status-completed" : "badge-status-pending"
                        }`}>
                          {inv.status || "Finalized"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="btn-primary-sm"
                          style={{ marginRight: "6px" }}
                          onClick={() => setViewInvoice(inv)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="btn-secondary-sm"
                          onClick={() => handleDownloadInvoice(inv._id, inv.invoiceNumber)}
                        >
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {assignModalBooking && (
        <AssignMechanicModal
          booking={assignModalBooking}
          mechanics={mechanics}
          onClose={() => setAssignModalBooking(null)}
          onAssigned={() => {
            setSuccess("Mechanic assigned successfully.");
            fetchDashboardData();
          }}
        />
      )}

      {taskModalBooking && (
        <TaskModal
          booking={taskModalBooking}
          mechanics={mechanics}
          canCreateTask={true}
          onClose={() => setTaskModalBooking(null)}
        />
      )}

      {billingModalBooking && (
        <BillingModal
          booking={billingModalBooking}
          onClose={() => setBillingModalBooking(null)}
          onSuccess={(savedInvoice, finalized) => {
            setSuccess(
              finalized
                ? "Bill finalized and service marked as completed."
                : "Draft bill saved successfully."
            );
            fetchDashboardData();
          }}
        />
      )}

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

export default GarageOwnerDashboard;
