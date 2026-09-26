import React from "react";
import { Link, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MainLayout = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-container">
      <header className="navbar">
        <div className="nav-brand">
          <Link to="/" className="brand-logo">
            <span className="brand-icon">🚗</span>
            <span className="brand-text">SmartAuto Service</span>
          </Link>
        </div>

        <nav className="nav-links">
          {isAuthenticated ? (
            <>
              {/* Customer Navigation */}
              {user?.role === "customer" && (
                <>
                  <Link to="/customer-dashboard" className="nav-link">
                    Dashboard
                  </Link>
                  <Link to="/vehicles" className="nav-link">
                    My Vehicles
                  </Link>
                  <Link to="/garages" className="nav-link">
                    Find Garages
                  </Link>
                  <Link to="/bookings" className="nav-link">
                    My Bookings
                  </Link>
                </>
              )}

              {/* Mechanic Navigation */}
              {(user?.role === "mechanic" || user?.role === "garage_owner") && (
                <>
                  <Link to="/mechanic-dashboard" className="nav-link">
                    Mechanic Dashboard
                  </Link>
                  <Link to="/mechanic-bookings" className="nav-link">
                    Service Requests
                  </Link>
                </>
              )}

              <div className="nav-user">
                <span className="user-name">{user?.name}</span>
                <span className={`role-badge role-${user?.role}`}>
                  {user?.role}
                </span>
                <button onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="btn-primary-sm">
                Register
              </Link>
            </div>
          )}
        </nav>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="footer">
        <p>Smart Vehicle Service Booking &amp; Mechanic Discovery Platform &copy; 2026</p>
      </footer>
    </div>
  );
};

export default MainLayout;
