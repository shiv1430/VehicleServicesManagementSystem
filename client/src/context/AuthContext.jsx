import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  const [loading, setLoading] = useState(false);

  // Sync token to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  // Sync user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post("/users/login", { email, password });
      const { token: receivedToken, user: receivedUser } = response.data;

      setToken(receivedToken);
      setUser(receivedUser);
      localStorage.setItem("token", receivedToken);
      localStorage.setItem("user", JSON.stringify(receivedUser));

      return receivedUser;
    } finally {
      setLoading(false);
    }
  };

  // Register handler
  const register = async ({ name, email, mobile, password, role = "customer" }) => {
    setLoading(true);
    try {
      const response = await api.post("/users/register", {
        name,
        email,
        mobile,
        password,
        role,
      });

      const { token: receivedToken, user: receivedUser } = response.data;
      setToken(receivedToken);
      setUser(receivedUser);
      localStorage.setItem("token", receivedToken);
      localStorage.setItem("user", JSON.stringify(receivedUser));

      return receivedUser;
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
