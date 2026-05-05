import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import {
  LayoutDashboard, Package, ShoppingCart,
  TrendingUp, Truck, Users, LogOut, Pill,
} from "lucide-react";

const NAV = [
  { to: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard, roles: ["manager","cashier","admin"] },
  { to: "/inventory",  label: "Inventory",  icon: Package,         roles: ["manager","admin"] },
  { to: "/pos",        label: "Point of Sale", icon: ShoppingCart,  roles: ["manager","cashier","admin"] },
  { to: "/forecasting",label: "AI Forecast", icon: TrendingUp,     roles: ["manager","admin"] },
  { to: "/suppliers",  label: "Suppliers",  icon: Truck,           roles: ["manager","admin"] },
  { to: "/users",      label: "Users",      icon: Users,           roles: ["admin"] },
];

export default function Sidebar() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out");
    navigate("/login");
  };

  const initials = currentUser?.email?.slice(0, 2).toUpperCase() || "U";
  const visibleNav = NAV.filter(n => n.roles.includes(userRole));

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: "rgba(255,255,255,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Pill size={18} color="white" />
          </div>
          <div>
            <h1>Pharmacy IMS</h1>
            <span>v1.0.0</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {visibleNav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <item.icon size={17} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-pill">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="name">{currentUser?.email?.split("@")[0]}</div>
            <div className="role">{userRole}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
