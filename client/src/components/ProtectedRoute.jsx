import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the appropriate dashboard based on user role
    if (user.role === "garage_owner") {
      return <Navigate to="/owner-dashboard" replace />;
    }
    if (user.role === "mechanic") {
      return <Navigate to="/mechanic-dashboard" replace />;
    }
    return <Navigate to="/customer-dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
