import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { differenceInDays, format } from "date-fns";
import {
  Package, AlertTriangle, ShoppingCart, TrendingUp,
  Clock, AlertCircle,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Dashboard() {
  const [stats, setStats]     = useState({ total: 0, expiring: 0, lowStock: 0, outOfStock: 0 });
  const [medicines, setMeds]  = useState([]);
  const [salesData, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "medicines"));
      const meds = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMeds(meds);

      const now = new Date();
      let expiring = 0, lowStock = 0, outOfStock = 0;
      meds.forEach(m => {
        const days = m.expiryDate?.toDate
          ? differenceInDays(m.expiryDate.toDate(), now)
          : 999;
        if (days <= 90 && days >= 0) expiring++;
        if (m.quantity === 0) outOfStock++;
        else if (m.quantity <= m.reorderLevel) lowStock++;
      });

      setStats({ total: meds.length, expiring, lowStock, outOfStock });

      // Build chart from real transactions
      const txnSnap = await getDocs(collection(db, "transactions"));
      const txns = txnSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const monthlySales = Array(12).fill(0);
      txns.forEach(txn => {
        if (txn.createdAt?.toDate) {
          const month = txn.createdAt.toDate().getMonth();
          const units = txn.items?.reduce((a, item) => a + item.qty, 0) || 0;
          monthlySales[month] += units;
        }
      });

      // Also add salesHistory from medicines as baseline
      const chartData = MONTHS.map((month, i) => {
        const historyTotal = meds.reduce((acc, m) => acc + (m.salesHistory?.[i] || 0), 0);
        return { month, units: monthlySales[i] + historyTotal };
      });
      setSales(chartData);
      setLoading(false);
    };
    load();
  }, []);

  const expiringMeds = medicines
    .filter(m => {
      if (!m.expiryDate?.toDate) return false;
      const days = differenceInDays(m.expiryDate.toDate(), new Date());
      return days >= 0 && days <= 90;
    })
    .sort((a, b) => a.expiryDate.toDate() - b.expiryDate.toDate())
    .slice(0, 5);

  const lowStockMeds = medicines
    .filter(m => m.quantity > 0 && m.quantity <= m.reorderLevel)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5);

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>Loading dashboard…</p>
    </div>
  );

  return (
    <>
      <div className="page-header">
        <h2>Dashboard</h2>
        <span style={{ fontSize: "0.78rem", color: "#6b7280", fontFamily: "Space Mono, monospace" }}>
          {new Date().toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </span>
      </div>

      <div className="page-body">
        {/* Stat cards */}
        <div className="stat-grid">
          <StatCard icon={<Package size={22} />} color="green" label="Total Medicines" value={stats.total} sub="in database" />
          <StatCard icon={<AlertTriangle size={22} />} color="amber" label="Expiring Soon" value={stats.expiring} sub="within 90 days" />
          <StatCard icon={<ShoppingCart size={22} />} color="blue" label="Low Stock" value={stats.lowStock} sub="below reorder level" />
          <StatCard icon={<AlertCircle size={22} />} color="red" label="Out of Stock" value={stats.outOfStock} sub="need immediate restock" />
        </div>

        {/* Sales chart */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">Monthly Sales Volume (Units)</div>
            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Last 12 months</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                  formatter={(v) => [`${v} units`, "Sales"]}
                />
                <Area type="monotone" dataKey="units" stroke="#16a34a" strokeWidth={2} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Two columns: expiring + low stock */}
        <div className="grid-2">
          {/* Expiry alerts */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={15} color="#f59e0b" />
                Expiry Alerts
              </div>
            </div>
            <div className="card-body" style={{ padding: "12px 22px" }}>
              {expiringMeds.length === 0 ? (
                <p style={{ fontSize: "0.82rem", color: "#9ca3af", padding: "12px 0" }}>No medicines expiring soon</p>
              ) : expiringMeds.map(m => {
                const days = differenceInDays(m.expiryDate.toDate(), new Date());
                return (
                  <div key={m.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 0", borderBottom: "1px solid #f3f4f6",
                  }}>
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#111827" }}>{m.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{m.sku} · Qty: {m.quantity}</div>
                    </div>
                    <span className={`badge ${days <= 30 ? "badge-red" : "badge-amber"}`}>
                      {days}d left
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Low stock */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <TrendingUp size={15} color="#ef4444" />
                Low Stock
              </div>
            </div>
            <div className="card-body" style={{ padding: "12px 22px" }}>
              {lowStockMeds.length === 0 ? (
                <p style={{ fontSize: "0.82rem", color: "#9ca3af", padding: "12px 0" }}>All stock levels healthy</p>
              ) : lowStockMeds.map(m => (
                <div key={m.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 0", borderBottom: "1px solid #f3f4f6",
                }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#111827" }}>{m.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Reorder at: {m.reorderLevel}</div>
                  </div>
                  <span className="badge badge-red">{m.quantity} left</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ icon, color, label, value, sub }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        <div className="stat-sub">{sub}</div>
      </div>
    </div>
  );
}
