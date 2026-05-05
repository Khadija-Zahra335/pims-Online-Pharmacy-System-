import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Sidebar from "./components/shared/Sidebar";
import Login from "./components/auth/Login";
import Dashboard from "./components/dashboard/Dashboard";
import Inventory from "./components/inventory/Inventory";
import POS from "./components/pos/POS";
import Forecasting from "./components/dashboard/Forecasting";
import Suppliers from "./components/suppliers/Suppliers";
import Users from "./components/users/Users";
import "./styles/global.css";

function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, userRole } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: "3rem" }}>🔒</div>
        <h2 style={{ color: "#374151" }}>Access Denied</h2>
        <p style={{ color: "#9ca3af" }}>Your role ({userRole}) doesn't have permission to access this page.</p>
      </div>
    );
  }
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">{children}</div>
    </div>
  );
}

function AppRoutes() {
  const { currentUser } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/dashboard"   element={<ProtectedRoute allowedRoles={["manager","cashier","admin"]}><Dashboard /></ProtectedRoute>} />
      <Route path="/inventory"   element={<ProtectedRoute allowedRoles={["manager","admin"]}><Inventory /></ProtectedRoute>} />
      <Route path="/pos"         element={<ProtectedRoute allowedRoles={["manager","cashier","admin"]}><POS /></ProtectedRoute>} />
      <Route path="/forecasting" element={<ProtectedRoute allowedRoles={["manager","admin"]}><Forecasting /></ProtectedRoute>} />
      <Route path="/suppliers"   element={<ProtectedRoute allowedRoles={["manager","admin"]}><Suppliers /></ProtectedRoute>} />
      <Route path="/users"       element={<ProtectedRoute allowedRoles={["admin"]}><Users /></ProtectedRoute>} />
      <Route path="*"            element={<Navigate to={currentUser ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: "DM Sans, sans-serif", fontSize: "0.85rem" },
            success: { iconTheme: { primary: "#15803d", secondary: "white" } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
