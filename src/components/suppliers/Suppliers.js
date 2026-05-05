import React, { useEffect, useState } from "react";
import {
  collection, getDocs, addDoc, updateDoc,
  deleteDoc, doc, Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import toast from "react-hot-toast";
import { Plus, Edit2, Trash2, X, Truck, Phone, Mail, Clock } from "lucide-react";

const EMPTY = {
  name: "", contact: "", phone: "", email: "",
  address: "", leadTimeDays: "", medicines: "",
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setModal]     = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [editId, setEditId]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);

  const load = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "suppliers"));
    setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setModal(true); };
  const openEdit = (s) => {
    setForm({ ...s, medicines: Array.isArray(s.medicines) ? s.medicines.join(", ") : s.medicines || "" });
    setEditId(s.id);
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.contact || !form.phone) {
      toast.error("Name, contact and phone are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        leadTimeDays: Number(form.leadTimeDays) || 3,
        medicines: typeof form.medicines === "string"
          ? form.medicines.split(",").map(s => s.trim()).filter(Boolean)
          : form.medicines,
      };
      if (editId) {
        await updateDoc(doc(db, "suppliers", editId), payload);
        toast.success("Supplier updated");
      } else {
        await addDoc(collection(db, "suppliers"), { ...payload, createdAt: Timestamp.now() });
        toast.success("Supplier added");
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error("Failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this supplier?")) return;
    await deleteDoc(doc(db, "suppliers", id));
    toast.success("Deleted");
    load();
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <>
      <div className="page-header">
        <h2>Supplier Management</h2>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={15} /> Add Supplier
        </button>
      </div>

      <div className="page-body">
        {suppliers.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: 80 }}>
            <Truck size={48} />
            <p>No suppliers yet. Add your first supplier.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {suppliers.map(s => (
              <div key={s.id} className="card" style={{ overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(135deg, #052e16, #15803d)", padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Truck size={20} color="white" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: "white", fontSize: "0.95rem" }}>{s.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>{s.contact}</div>
                    </div>
                  </div>
                </div>
                <div className="card-body" style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.83rem", color: "#374151" }}>
                      <Phone size={13} color="#9ca3af" /> {s.phone}
                    </div>
                    {s.email && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.83rem", color: "#374151" }}>
                        <Mail size={13} color="#9ca3af" /> {s.email}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.83rem", color: "#374151" }}>
                      <Clock size={13} color="#9ca3af" /> Lead time: <strong>{s.leadTimeDays} days</strong>
                    </div>
                  </div>

                  {s.address && (
                    <div style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: 12, lineHeight: 1.5 }}>{s.address}</div>
                  )}

                  {Array.isArray(s.medicines) && s.medicines.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: "#9ca3af", marginBottom: 6 }}>
                        Supplied Medicines
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {s.medicines.map(m => (
                          <span key={m} className="badge badge-green" style={{ fontSize: "0.68rem" }}>{m}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(s)}>
                      <Edit2 size={13} /> Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editId ? "Edit Supplier" : "Add Supplier"}</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <F label="Company Name *" value={form.name}        onChange={v => setForm({...form, name: v})}        placeholder="MedLine Distributors" />
                <F label="Contact Person *" value={form.contact}   onChange={v => setForm({...form, contact: v})}     placeholder="Ali Hassan" />
                <F label="Phone *"        value={form.phone}       onChange={v => setForm({...form, phone: v})}       placeholder="+92-42-111-555-666" />
                <F label="Email"          value={form.email}       onChange={v => setForm({...form, email: v})}       placeholder="orders@supplier.com" type="email" />
                <F label="Lead Time (days)" value={form.leadTimeDays} onChange={v => setForm({...form, leadTimeDays: v})} type="number" placeholder="3" />
              </div>
              <F label="Address" value={form.address} onChange={v => setForm({...form, address: v})} placeholder="Ferozepur Road, Lahore" />
              <div className="form-group">
                <label className="form-label">Supplied Medicines (comma-separated)</label>
                <input className="form-input" value={form.medicines} onChange={e => setForm({...form, medicines: e.target.value})} placeholder="Paracetamol 500mg, Ibuprofen 400mg" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : editId ? "Update" : "Add Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function F({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input type={type} className="form-input" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
