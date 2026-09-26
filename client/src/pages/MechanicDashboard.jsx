import React from "react";
import { useAuth } from "../context/AuthContext";

const MechanicDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Mechanic Dashboard</h1>
        <p className="dashboard-subtitle">
          Welcome back, {user?.name || "Mechanic"}! Manage assigned service requests and update job progress.
        </p>
      </div>

      <div className="user-profile-bar">
        <div className="profile-item">
          <strong>Email:</strong> {user?.email}
        </div>
        <div className="profile-item">
          <strong>Mobile:</strong> {user?.mobile}
        </div>
        <div className="profile-item">
          <strong>Role:</strong> <span className="badge badge-mechanic">{user?.role}</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card dashboard-card">
          <div className="card-icon">📥</div>
          <h3>Booking Requests</h3>
          <p>Review incoming appointment requests and accept or schedule upcoming service jobs.</p>
          <span className="card-action">Ready for Milestone 4 &rarr;</span>
        </div>

        <div className="card dashboard-card">
          <div className="card-icon">⚙️</div>
          <h3>Active Services</h3>
          <p>Update live service progress (Inspection, In-Progress, Completed) for vehicle owners.</p>
          <span className="card-action">Ready for Milestone 4 &rarr;</span>
        </div>

        <div className="card dashboard-card">
          <div className="card-icon">✅</div>
          <h3>Completed Services</h3>
          <p>View finished repair records, generate customer invoices, and see feedback.</p>
          <span className="card-action">Ready for Milestone 4 &rarr;</span>
        </div>
      </div>
    </div>
  );
};

export default MechanicDashboard;
