import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { TrendingUp, RefreshCw, Brain, Package } from "lucide-react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Simple Linear Regression forecast
function linearForecast(salesHistory, nextN = 4) {
  const n = salesHistory.length;
  if (n < 2) return Array(nextN).fill(0);
  const xs = salesHistory.map((_, i) => i);
  const ys = salesHistory;
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  xs.forEach((x, i) => { num += (x - xMean) * (ys[i] - yMean); den += (x - xMean) ** 2; });
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  return Array.from({ length: nextN }, (_, i) => {
    const predicted = Math.round(intercept + slope * (n + i));
    return Math.max(0, predicted);
  });
}

function getReorderQty(med, forecastNext4Weeks) {
  const totalDemand = forecastNext4Weeks.reduce((a, b) => a + b, 0);
  const needed = totalDemand + (med.reorderLevel || 50);
  return Math.max(0, needed - med.quantity);
}

export default function Forecasting() {
  const [medicines, setMeds]   = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);

  const compute = (meds) => {
    const result = meds.map(med => {
      const history = med.salesHistory || Array(12).fill(10);
      const nextWeeks = linearForecast(history, 4); // 4-week forecast
      const reorderQty = getReorderQty(med, nextWeeks);
      const avgSales = history.reduce((a, b) => a + b, 0) / history.length;
      const trend = history.length >= 2
        ? ((history[history.length - 1] - history[0]) / (history[0] || 1)) * 100
        : 0;
      return { ...med, nextWeeks, reorderQty, avgSales: Math.round(avgSales), trend: Math.round(trend) };
    });
    result.sort((a, b) => b.reorderQty - a.reorderQty);
    setForecasts(result);
    if (!selected && result.length) setSelected(result[0]);
  };

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "medicines"));
      const meds = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMeds(meds);
      compute(meds);
      setLoading(false);
    };
    load();
  }, []);

  const WEEK_LABELS = ["Week 1","Week 2","Week 3","Week 4"];

  const chartData = selected
    ? [
        ...((selected.salesHistory || []).slice(-4).map((v, i) => ({
          period: MONTHS[Math.max(0, (new Date().getMonth() - 3 + i))],
          actual: v,
          forecast: null,
        }))),
        ...(selected.nextWeeks || []).map((v, i) => ({
          period: WEEK_LABELS[i],
          actual: null,
          forecast: v,
        })),
      ]
    : [];

  const restockList = forecasts.filter(f => f.reorderQty > 0).slice(0, 10);

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>Computing AI forecasts…</p>
    </div>
  );

  return (
    <>
      <div className="page-header">
        <h2>AI Demand Forecasting</h2>
        <button className="btn btn-secondary" onClick={() => compute(medicines)}>
          <RefreshCw size={14} /> Recalculate
        </button>
      </div>

      <div className="page-body">
        {/* Info banner */}
        <div className="alert alert-success" style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <Brain size={18} />
          <div>
            <strong>AI Forecasting Active</strong> — Using linear regression on 12-month sales history
            to predict next 4 weeks demand. Results factor in sales velocity and current stock levels.
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: 20 }}>
          {/* Restock recommendations */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Package size={15} color="#15803d" />
                Recommended Restock List
              </div>
            </div>
            <div className="card-body" style={{ padding: "8px 0" }}>
              {restockList.length === 0 ? (
                <div className="empty-state"><p>All stock levels are adequate</p></div>
              ) : restockList.map(med => (
                <div
                  key={med.id}
                  onClick={() => setSelected(med)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "11px 22px", cursor: "pointer",
                    background: selected?.id === med.id ? "#f0fdf4" : "transparent",
                    borderLeft: selected?.id === med.id ? "3px solid #15803d" : "3px solid transparent",
                    transition: "all 0.15s",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#111827" }}>{med.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      Current: {med.quantity} · Avg/mo: {med.avgSales}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "Space Mono, monospace", fontWeight: 700, color: "#ef4444", fontSize: "0.9rem" }}>
                      Order {med.reorderQty}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: med.trend >= 0 ? "#15803d" : "#ef4444" }}>
                      {med.trend >= 0 ? "↑" : "↓"} {Math.abs(med.trend)}% trend
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected medicine forecast chart */}
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <TrendingUp size={15} color="#15803d" />
                {selected ? selected.name : "Select a medicine"}
              </div>
            </div>
            <div className="card-body">
              {selected ? (
                <>
                  <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                    <div style={{ flex: 1, background: "#f0fdf4", borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>Current Stock</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#111827" }}>{selected.quantity}</div>
                    </div>
                    <div style={{ flex: 1, background: "#fef3c7", borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>Forecast (4wk)</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#111827" }}>
                        {selected.nextWeeks?.reduce((a, b) => a + b, 0)}
                      </div>
                    </div>
                    <div style={{ flex: 1, background: "#fee2e2", borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>Reorder Qty</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ef4444" }}>{selected.reorderQty}</div>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 11 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="actual"   name="Actual Sales" fill="#16a34a" radius={[4,4,0,0]} />
                      <Bar dataKey="forecast" name="Forecast"      fill="#fbbf24" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="empty-state">
                  <TrendingUp size={40} />
                  <p>Select a medicine from the list to view forecast</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full forecast table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">All Medicines — 4-Week Forecast</div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Current Stock</th>
                  <th>Avg Monthly Sales</th>
                  <th>Wk 1</th><th>Wk 2</th><th>Wk 3</th><th>Wk 4</th>
                  <th>Total Forecast</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {forecasts.map(med => (
                  <tr key={med.id} style={{ cursor: "pointer" }} onClick={() => setSelected(med)}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{med.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{med.sku}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: med.quantity <= med.reorderLevel ? "#ef4444" : "#111827" }}>
                        {med.quantity}
                      </span>
                    </td>
                    <td style={{ fontFamily: "Space Mono, monospace" }}>{med.avgSales}</td>
                    {(med.nextWeeks || [0,0,0,0]).map((w, i) => (
                      <td key={i} style={{ fontFamily: "Space Mono, monospace", color: "#374151" }}>{w}</td>
                    ))}
                    <td style={{ fontFamily: "Space Mono, monospace", fontWeight: 700 }}>
                      {(med.nextWeeks || []).reduce((a, b) => a + b, 0)}
                    </td>
                    <td>
                      {med.reorderQty > 0 ? (
                        <span className="badge badge-red">Order {med.reorderQty}</span>
                      ) : (
                        <span className="badge badge-green">Sufficient</span>
                      )}
                    </td>
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
