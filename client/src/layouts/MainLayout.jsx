import React, { useState } from "react";
import { NavLink, Link, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MainLayout = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="app-container">
      <header className="navbar">
        <div className="nav-brand">
          <Link to="/" className="brand-logo" onClick={closeMobileMenu}>
            <span className="brand-icon">🚗</span>
            <span className="brand-text">SmartAuto Service</span>
          </Link>
        </div>

        {/* Mobile toggle button */}
        <button
          className="mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>

        <nav className={`nav-links ${mobileMenuOpen ? "nav-links-open" : ""}`}>
          {isAuthenticated ? (
            <>
              {/* Customer Navigation */}
              {user?.role === "customer" && (
                <>
                  <NavLink
                    to="/customer-dashboard"
                    className="nav-link"
                    onClick={closeMobileMenu}
                  >
                    Dashboard
                  </NavLink>
                  <NavLink
                    to="/vehicles"
                    className="nav-link"
                    onClick={closeMobileMenu}
                  >
                    My Vehicles
                  </NavLink>
                  <NavLink
                    to="/garages"
                    className="nav-link"
                    onClick={closeMobileMenu}
                  >
                    Find Garages
                  </NavLink>
                  <NavLink
                    to="/bookings"
                    className="nav-link"
                    onClick={closeMobileMenu}
                  >
                    My Bookings
                  </NavLink>
                </>
              )}

              {/* Garage Owner Navigation */}
              {user?.role === "garage_owner" && (
                <>
                  <NavLink
                    to="/owner-dashboard"
                    className="nav-link"
                    onClick={closeMobileMenu}
                  >
                    Garage Management
                  </NavLink>
                </>
              )}

              {/* Mechanic Navigation */}
              {user?.role === "mechanic" && (
                <>
                  <NavLink
                    to="/mechanic-dashboard"
                    className="nav-link"
                    onClick={closeMobileMenu}
                  >
                    Mechanic Station
                  </NavLink>
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
              <NavLink to="/login" className="nav-link" onClick={closeMobileMenu}>
                Login
              </NavLink>
              <Link to="/register" className="btn-primary-sm" onClick={closeMobileMenu}>
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
