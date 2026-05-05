import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { Users as UsersIcon, Shield, ShoppingCart, Settings } from "lucide-react";

const ROLE_INFO = {
  manager: { icon: Shield, color: "#15803d", bg: "#f0fdf4", label: "Manager", desc: "Full access to inventory, AI forecasting, reports, and suppliers." },
  cashier: { icon: ShoppingCart, color: "#1d4ed8", bg: "#eff6ff", label: "Cashier", desc: "Access to POS module only. Can process sales and generate invoices." },
  admin:   { icon: Settings, color: "#7c3aed", bg: "#f5f3ff", label: "Admin", desc: "System-level access. Can manage users, roles, and all modules." },
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header">
        <h2>User Management</h2>
        <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>Admin view — RBAC overview</span>
      </div>

      <div className="page-body">
        {/* RBAC summary */}
        <div className="grid-3" style={{ marginBottom: 24 }}>
          {Object.entries(ROLE_INFO).map(([role, info]) => (
            <div key={role} className="card">
              <div className="card-body">
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: info.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <info.icon size={20} color={info.color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#111827" }}>{info.label}</div>
                    <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{users.filter(u => u.role === role).length} user(s)</div>
                  </div>
                </div>
                <p style={{ fontSize: "0.8rem", color: "#6b7280", lineHeight: 1.5 }}>{info.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Users table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <UsersIcon size={15} /> All System Users
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Access Level</th>
                  <th>Demo Password</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const info = ROLE_INFO[u.role] || ROLE_INFO.cashier;
                  const passwords = { manager: "Manager@123", cashier: "Cashier@123", admin: "Admin@123" };
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: info.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <info.icon size={15} color={info.color} />
                          </div>
                          <span style={{ fontWeight: 600, color: "#111827" }}>{u.name || u.email?.split("@")[0]}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: "Space Mono, monospace", fontSize: "0.78rem" }}>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === "manager" ? "badge-green" : u.role === "admin" ? "badge-blue" : "badge-gray"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "#6b7280" }}>{info.desc.split(".")[0]}</td>
                      <td>
                        <code style={{ fontSize: "0.78rem", background: "#f3f4f6", padding: "2px 8px", borderRadius: 4, fontFamily: "Space Mono, monospace" }}>
                          {passwords[u.role] || "—"}
                        </code>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RBAC matrix */}
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header"><div className="card-title">Access Control Matrix</div></div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Module</th>
                  <th style={{ textAlign: "center" }}>Admin</th>
                  <th style={{ textAlign: "center" }}>Manager</th>
                  <th style={{ textAlign: "center" }}>Cashier</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Dashboard", true, true, true],
                  ["Inventory (CRUD)", true, true, false],
                  ["Point of Sale", true, true, true],
                  ["AI Forecasting", true, true, false],
                  ["Supplier Management", true, true, false],
                  ["User Management", true, false, false],
                ].map(([module, admin, manager, cashier]) => (
                  <tr key={module}>
                    <td style={{ fontWeight: 500 }}>{module}</td>
                    {[admin, manager, cashier].map((v, i) => (
                      <td key={i} style={{ textAlign: "center" }}>
                        {v ? <span style={{ color: "#15803d", fontSize: "1.1rem" }}>✓</span> : <span style={{ color: "#d1d5db" }}>—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
