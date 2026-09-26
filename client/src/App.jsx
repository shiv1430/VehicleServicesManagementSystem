import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CustomerDashboard from "./pages/CustomerDashboard";
import MechanicDashboard from "./pages/MechanicDashboard";
import Vehicles from "./pages/Vehicles";
import Garages from "./pages/Garages";
import CreateBooking from "./pages/CreateBooking";
import Bookings from "./pages/Bookings";

// Root redirect based on auth status
const HomeRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === "mechanic") {
    return <Navigate to="/mechanic-dashboard" replace />;
  }

  return <Navigate to="/customer-dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Application Layout Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomeRedirect />} />

            {/* Customer Routes */}
            <Route
              path="/customer-dashboard"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vehicles"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <Vehicles />
                </ProtectedRoute>
              }
            />

            <Route
              path="/garages"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <Garages />
                </ProtectedRoute>
              }
            />

            <Route
              path="/create-booking"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <CreateBooking />
                </ProtectedRoute>
              }
            />

            <Route
              path="/bookings"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <Bookings />
                </ProtectedRoute>
              }
            />

            {/* Mechanic Routes */}
            <Route
              path="/mechanic-dashboard"
              element={
                <ProtectedRoute allowedRoles={["mechanic", "garage_owner"]}>
                  <MechanicDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
