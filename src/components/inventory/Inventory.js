import React, { useEffect, useState } from "react";
import {
  collection, getDocs, addDoc, updateDoc,
  deleteDoc, doc, Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { differenceInDays, format } from "date-fns";
import toast from "react-hot-toast";
import { Plus, Search, Edit2, Trash2, X, Package, AlertTriangle } from "lucide-react";

const EMPTY = {
  name: "", genericName: "", category: "", manufacturer: "",
  batchNumber: "", sku: "", quantity: "", unitPrice: "",
  reorderLevel: "", expiryDate: "", barcode: "",
  alternatives: "", salesHistory: [],
};

const CATEGORIES = [
  "Analgesic","Antibiotic","Antidiabetic","Antacid","Statin",
  "Antihistamine","Antiplatelet","NSAID","Antihypertensive",
  "Antidepressant","Vitamin","Other",
];

export default function Inventory() {
  const [medicines, setMeds]   = useState([]);
  const [search, setSearch]    = useState("");
  const [filter, setFilter]    = useState("all");
  const [showModal, setModal]  = useState(false);
  const [form, setForm]        = useState(EMPTY);
  const [editId, setEditId]    = useState(null);
  const [loading, setLoading]  = useState(true);
  const [saving, setSaving]    = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadMeds = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "medicines"));
    setMeds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { loadMeds(); }, []);

  const getStatus = (med) => {
    if (med.quantity === 0) return "outofstock";
    const days = med.expiryDate?.toDate
      ? differenceInDays(med.expiryDate.toDate(), new Date())
      : 999;
    if (days < 0) return "expired";
    if (days <= 30) return "critical";
    if (days <= 90 || med.quantity <= med.reorderLevel) return "warning";
    return "healthy";
  };

  const filtered = medicines.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = m.name?.toLowerCase().includes(q) ||
      m.sku?.toLowerCase().includes(q) ||
      m.genericName?.toLowerCase().includes(q) ||
      m.barcode?.includes(q);
    const status = getStatus(m);
    if (filter === "all")       return matchSearch;
    if (filter === "expiring")  return matchSearch && (status === "critical" || status === "warning");
    if (filter === "low")       return matchSearch && m.quantity <= m.reorderLevel && m.quantity > 0;
    if (filter === "outofstock")return matchSearch && m.quantity === 0;
    return matchSearch;
  });

  const openAdd = () => { setForm(EMPTY); setEditId(null); setModal(true); };
  const openEdit = (med) => {
    setForm({
      ...med,
      expiryDate: med.expiryDate?.toDate
        ? format(med.expiryDate.toDate(), "yyyy-MM-dd")
        : "",
      alternatives: Array.isArray(med.alternatives)
        ? med.alternatives.join(", ")
        : med.alternatives || "",
    });
    setEditId(med.id);
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.sku || !form.quantity || !form.unitPrice || !form.expiryDate) {
      toast.error("Please fill all required fields");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        quantity:     Number(form.quantity),
        unitPrice:    Number(form.unitPrice),
        reorderLevel: Number(form.reorderLevel) || 50,
        expiryDate:   Timestamp.fromDate(new Date(form.expiryDate)),
        alternatives: typeof form.alternatives === "string"
          ? form.alternatives.split(",").map(s => s.trim()).filter(Boolean)
          : form.alternatives,
        salesHistory: form.salesHistory?.length ? form.salesHistory : Array(12).fill(0),
      };

      if (editId) {
        await updateDoc(doc(db, "medicines", editId), payload);
        toast.success("Medicine updated");
      } else {
        await addDoc(collection(db, "medicines"), {
          ...payload, createdAt: Timestamp.now(),
        });
        toast.success("Medicine added");
      }
      setModal(false);
      loadMeds();
    } catch (err) {
      toast.error("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "medicines", id));
      toast.success("Medicine deleted");
      setDeleteConfirm(null);
      loadMeds();
    } catch {
      toast.error("Delete failed");
    }
  };

  const STATUS_BADGE = {
    healthy:    { label: "Healthy",     cls: "badge-green" },
    warning:    { label: "Warning",     cls: "badge-amber" },
    critical:   { label: "Critical",    cls: "badge-red"   },
    expired:    { label: "Expired",     cls: "badge-red"   },
    outofstock: { label: "Out of Stock",cls: "badge-gray"  },
  };

  return (
    <>
      <div className="page-header">
        <h2>Inventory Management</h2>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={15} /> Add Medicine
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
            <input
              className="form-input"
              style={{ paddingLeft: 34 }}
              placeholder="Search by name, SKU, barcode…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {["all","expiring","low","outofstock"].map(f => (
            <button
              key={f}
              className={`btn ${filter === f ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : f === "expiring" ? "Expiring" : f === "low" ? "Low Stock" : "Out of Stock"}
            </button>
          ))}
        </div>

        <div className="card">
          <div className="table-wrapper">
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
                <div className="spinner" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <Package size={48} />
                <p>No medicines found</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(med => {
                    const status = getStatus(med);
                    const badge  = STATUS_BADGE[status];
                    const expDate = med.expiryDate?.toDate
                      ? format(med.expiryDate.toDate(), "dd MMM yyyy")
                      : "—";
                    return (
                      <tr key={med.id}>
                        <td>
                          <span style={{ fontFamily: "Space Mono, monospace", fontSize: "0.78rem", color: "#6b7280" }}>
                            {med.sku}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: "#111827" }}>{med.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{med.genericName}</div>
                        </td>
                        <td>
                          <span className="badge badge-blue">{med.category}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: med.quantity === 0 ? "#ef4444" : med.quantity <= med.reorderLevel ? "#f59e0b" : "#111827" }}>
                            {med.quantity}
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}> / {med.reorderLevel}</span>
                        </td>
                        <td>
                          <span style={{ fontFamily: "Space Mono, monospace" }}>
                            Rs. {med.unitPrice?.toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            {(status === "critical" || status === "warning") && (
                              <AlertTriangle size={13} color="#f59e0b" />
                            )}
                            {expDate}
                          </div>
                        </td>
                        <td><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(med)}>
                              <Edit2 size={13} />
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(med)}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <div className="modal-title">{editId ? "Edit Medicine" : "Add New Medicine"}</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <Field label="Medicine Name *" value={form.name} onChange={v => setForm({...form, name: v})} placeholder="Paracetamol 500mg" />
                <Field label="Generic Name" value={form.genericName} onChange={v => setForm({...form, genericName: v})} placeholder="Acetaminophen" />
                <Field label="SKU *" value={form.sku} onChange={v => setForm({...form, sku: v})} placeholder="MED-001" />
                <Field label="Barcode" value={form.barcode} onChange={v => setForm({...form, barcode: v})} placeholder="1234567890001" />
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    <option value="">Select…</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <Field label="Manufacturer" value={form.manufacturer} onChange={v => setForm({...form, manufacturer: v})} placeholder="GSK Pakistan" />
                <Field label="Batch Number" value={form.batchNumber} onChange={v => setForm({...form, batchNumber: v})} placeholder="BATCH-001" />
                <Field label="Expiry Date *" value={form.expiryDate} onChange={v => setForm({...form, expiryDate: v})} type="date" />
                <Field label="Quantity *" value={form.quantity} onChange={v => setForm({...form, quantity: v})} type="number" placeholder="500" />
                <Field label="Unit Price (Rs.) *" value={form.unitPrice} onChange={v => setForm({...form, unitPrice: v})} type="number" placeholder="15" />
                <Field label="Reorder Level" value={form.reorderLevel} onChange={v => setForm({...form, reorderLevel: v})} type="number" placeholder="100" />
              </div>
              <div className="form-group">
                <label className="form-label">Alternatives (comma-separated)</label>
                <input className="form-input" value={form.alternatives} onChange={e => setForm({...form, alternatives: e.target.value})} placeholder="Panadol 500mg, Calpol 500mg" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : editId ? "Update" : "Add Medicine"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Confirm Delete</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "0.88rem", color: "#374151" }}>
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        type={type}
        className="form-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
