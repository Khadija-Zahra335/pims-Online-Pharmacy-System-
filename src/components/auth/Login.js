import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import { Lock, Mail, Pill, Eye, EyeOff } from "lucide-react";

const DEMO_CREDS = [
  { role: "Manager", email: "manager@pims.com", password: "Manager@123", color: "#15803d" },
  { role: "Cashier", email: "cashier@pims.com", password: "Cashier@123", color: "#1d4ed8" },
  { role: "Admin",   email: "admin@pims.com",   password: "Admin@123",   color: "#7c3aed" },
];

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch {
      toast.error("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (cred) => {
    setEmail(cred.email);
    setPassword(cred.password);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      background: "linear-gradient(135deg, #052e16 0%, #166534 40%, #15803d 100%)",
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "48px", color: "white",
      }}>
        <div style={{ maxWidth: 440 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            marginBottom: 32,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Pill size={28} color="white" />
            </div>
            <div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, lineHeight: 1.2 }}>PIMS</div>
              <div style={{ fontSize: "0.72rem", opacity: 0.6, letterSpacing: 2, fontFamily: "Space Mono, monospace", textTransform: "uppercase" }}>
                Pharmacy Inventory System
              </div>
            </div>
          </div>

          <h1 style={{ fontSize: "2.2rem", fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
            Smart Inventory<br />Management
          </h1>
          <p style={{ opacity: 0.7, fontSize: "0.95rem", lineHeight: 1.7, marginBottom: 40 }}>
            Real-time stock tracking, AI-powered demand forecasting, automated
            expiry alerts, and seamless POS — built for modern pharmacies.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {["📦 Real-time inventory control", "🤖 AI demand forecasting", "🧾 Automated invoice generation", "⚠️ Expiry monitoring alerts", "🔐 Role-based access control"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.85rem", opacity: 0.85 }}>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div style={{
        width: 440, background: "#fff", display: "flex",
        flexDirection: "column", justifyContent: "center",
        padding: "48px 40px", boxShadow: "-20px 0 60px rgba(0,0,0,0.25)",
      }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827", marginBottom: 6 }}>
          Sign in
        </h2>
        <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: 32 }}>
          Access your pharmacy dashboard
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <div style={{ position: "relative" }}>
              <Mail size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: 36 }}
                placeholder="you@pharmacy.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <Lock size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input
                type={showPass ? "text" : "password"}
                className="form-input"
                style={{ paddingLeft: 36, paddingRight: 36 }}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Demo credentials */}
        <div style={{ marginTop: 32 }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#9ca3af", marginBottom: 12, fontFamily: "Space Mono, monospace" }}>
            Demo Credentials
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {DEMO_CREDS.map(cred => (
              <button
                key={cred.role}
                onClick={() => fillDemo(cred)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderRadius: 8,
                  border: "1px solid #e5e7eb", background: "#f9fafb",
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                  fontFamily: "DM Sans, sans-serif",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"}
                onMouseLeave={e => e.currentTarget.style.background = "#f9fafb"}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: cred.color, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, color: "white",
                }}>
                  {cred.role[0]}
                </div>
                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>{cred.role}</div>
                  <div style={{ fontSize: "0.72rem", color: "#9ca3af", fontFamily: "Space Mono, monospace" }}>{cred.email}</div>
                </div>
                <div style={{ marginLeft: "auto", fontSize: "0.7rem", color: "#9ca3af" }}>Click to fill →</div>
              </button>
            ))}
          </div>
        </div>

        <p style={{ marginTop: 32, fontSize: "0.72rem", color: "#d1d5db", textAlign: "center" }}>
          University of the Punjab · SPM/SRE Project 2026
        </p>
      </div>
    </div>
  );
}
