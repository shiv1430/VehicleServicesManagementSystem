import React from "react";
import { useAuth } from "../context/AuthContext";

const CustomerDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name || "Customer"}!</h1>
        <p className="dashboard-subtitle">
          Manage your vehicles, discover nearby garages, and track service bookings.
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
          <strong>Role:</strong> <span className="badge badge-customer">{user?.role}</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card dashboard-card">
          <div className="card-icon">🚗</div>
          <h3>My Vehicles</h3>
          <p>Register your cars and bikes, update specifications, and track service history.</p>
          <span className="card-action">Ready for Milestone 3 &rarr;</span>
        </div>

        <div className="card dashboard-card">
          <div className="card-icon">🔧</div>
          <h3>Find Garages &amp; Mechanics</h3>
          <p>Discover verified local garages, compare service rates, and view ratings.</p>
          <span className="card-action">Ready for Milestone 3 &rarr;</span>
        </div>

        <div className="card dashboard-card">
          <div className="card-icon">📅</div>
          <h3>My Bookings</h3>
          <p>Schedule service appointments, track status updates, and review completed jobs.</p>
          <span className="card-action">Ready for Milestone 3 &rarr;</span>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
