import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    vehiclesCount: 0,
    bookingsCount: 0,
    pendingCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [vehiclesRes, bookingsRes] = await Promise.all([
          api.get("/vehicles"),
          api.get("/bookings"),
        ]);

        const vList = vehiclesRes.data || [];
        const bList = bookingsRes.data || [];
        const pending = bList.filter((b) => b.status === "pending").length;

        setStats({
          vehiclesCount: vList.length,
          bookingsCount: bList.length,
          pendingCount: pending,
        });
      } catch (err) {
        // Silently fail stats to keep dashboard functional
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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

      {/* Summary KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-number">{loading ? "..." : stats.vehiclesCount}</span>
          <span className="stat-title">Registered Vehicles</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{loading ? "..." : stats.bookingsCount}</span>
          <span className="stat-title">Total Bookings</span>
        </div>
        <div className="stat-card">
          <span className="stat-number stat-highlight">{loading ? "..." : stats.pendingCount}</span>
          <span className="stat-title">Pending Services</span>
        </div>
      </div>

      {/* Action Workflow Cards */}
      <div className="dashboard-grid">
        <Link to="/vehicles" className="card dashboard-card card-link">
          <div className="card-icon">🚗</div>
          <h3>My Vehicles</h3>
          <p>Register your cars and bikes, update specifications, and manage ownership details.</p>
          <span className="card-action">Manage Vehicles &rarr;</span>
        </Link>

        <Link to="/garages" className="card dashboard-card card-link">
          <div className="card-icon">🔧</div>
          <h3>Find Garages &amp; Mechanics</h3>
          <p>Discover verified local garages, compare service rates, and view ratings.</p>
          <span className="card-action">Browse Garages &rarr;</span>
        </Link>

        <Link to="/bookings" className="card dashboard-card card-link">
          <div className="card-icon">📅</div>
          <h3>My Service Bookings</h3>
          <p>Schedule service appointments, track status updates, and review completed jobs.</p>
          <span className="card-action">View Bookings &rarr;</span>
        </Link>
      </div>
    </div>
  );
};

export default CustomerDashboard;
