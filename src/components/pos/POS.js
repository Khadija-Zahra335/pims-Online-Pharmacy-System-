import React, { useEffect, useState, useRef } from "react";
import {
  collection, getDocs, updateDoc, doc,
  addDoc, Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";
import {
  Search, Plus, Minus, Trash2, Printer,
  ShoppingCart, AlertTriangle, CheckCircle,
} from "lucide-react";

export default function POS() {
  const { currentUser } = useAuth();
  const [medicines, setMeds]     = useState([]);
  const [cart, setCart]          = useState([]);
  const [search, setSearch]      = useState("");
  const [barcodeInput, setBarcode] = useState("");
  const [altModal, setAltModal]  = useState(null);
  const [invoiceModal, setInvoice] = useState(null);
  const [processing, setProcessing] = useState(false);
  const barcodeRef = useRef();

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "medicines"));
      setMeds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    load();
  }, []);

  const searchResults = search.length > 1
    ? medicines.filter(m =>
        (m.name?.toLowerCase().includes(search.toLowerCase()) ||
         m.genericName?.toLowerCase().includes(search.toLowerCase())) &&
        m.quantity > 0
      ).slice(0, 8)
    : [];

  const addToCart = (med, qty = 1) => {
    if (med.quantity === 0) {
      // Suggest alternatives
      const alts = medicines.filter(m =>
        med.alternatives?.includes(m.name) && m.quantity > 0
      );
      if (alts.length > 0) {
        setAltModal({ requested: med, alternatives: alts });
      } else {
        toast.error(`${med.name} is out of stock and no alternatives available`);
      }
      return;
    }
    setCart(prev => {
      const existing = prev.find(c => c.id === med.id);
      if (existing) {
        if (existing.qty + qty > med.quantity) {
          toast.error(`Only ${med.quantity} units available`);
          return prev;
        }
        return prev.map(c => c.id === med.id ? { ...c, qty: c.qty + qty } : c);
      }
      return [...prev, { ...med, qty }];
    });
    setSearch("");
    toast.success(`${med.name} added to cart`, { duration: 1500 });
  };

  const handleBarcodeSearch = (e) => {
    if (e.key === "Enter") {
      const med = medicines.find(m => m.barcode === barcodeInput.trim());
      if (med) { addToCart(med); setBarcode(""); }
      else toast.error("Barcode not found");
    }
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(c => {
      if (c.id !== id) return c;
      const newQty = c.qty + delta;
      if (newQty < 1) return c;
      if (newQty > c.quantity) { toast.error(`Only ${c.quantity} in stock`); return c; }
      return { ...c, qty: newQty };
    }));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(c => c.id !== id));

  const subtotal = cart.reduce((a, c) => a + c.qty * c.unitPrice, 0);
  const tax      = subtotal * 0.05;   // 5% GST
  const total    = subtotal + tax;

  const checkout = async () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    setProcessing(true);
    try {
      // Deduct stock
      for (const item of cart) {
        await updateDoc(doc(db, "medicines", item.id), {
          quantity: item.quantity - item.qty,
        });
      }

      // Save transaction
      const invoiceNo = `INV-${Date.now()}`;
      const txn = {
        invoiceNo,
        cashier:   currentUser.email,
        items:     cart.map(c => ({ id: c.id, name: c.name, qty: c.qty, unitPrice: c.unitPrice, total: c.qty * c.unitPrice })),
        subtotal, tax, total,
        createdAt: Timestamp.now(),
      };
      await addDoc(collection(db, "transactions"), txn);

      // Refresh medicines
      const snap = await getDocs(collection(db, "medicines"));
      setMeds(snap.docs.map(d => ({ id: d.id, ...d.data() })));

      setInvoice(txn);
      setCart([]);
      toast.success("Transaction complete!");
    } catch (err) {
      toast.error("Checkout failed: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const printInvoice = (inv) => {
    const pdf = new jsPDF({ unit: "mm", format: [80, 200] });
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("PHARMACY INVENTORY SYSTEM", 40, 10, { align: "center" });
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text("University of the Punjab", 40, 15, { align: "center" });
    pdf.line(5, 18, 75, 18);
    pdf.text(`Invoice: ${inv.invoiceNo}`, 5, 23);
    pdf.text(`Date: ${new Date().toLocaleString("en-PK")}`, 5, 28);
    pdf.text(`Cashier: ${inv.cashier}`, 5, 33);
    pdf.line(5, 36, 75, 36);

    let y = 42;
    pdf.setFont("helvetica", "bold");
    pdf.text("Item", 5, y);
    pdf.text("Qty", 45, y);
    pdf.text("Price", 55, y);
    pdf.text("Total", 65, y);
    y += 5;
    pdf.line(5, y - 1, 75, y - 1);
    pdf.setFont("helvetica", "normal");

    inv.items.forEach(item => {
      const name = item.name.length > 22 ? item.name.slice(0, 22) + "…" : item.name;
      pdf.text(name, 5, y);
      pdf.text(String(item.qty), 45, y);
      pdf.text(String(item.unitPrice), 55, y);
      pdf.text(String(item.total), 65, y);
      y += 6;
    });

    pdf.line(5, y, 75, y); y += 5;
    pdf.text(`Subtotal:`, 40, y); pdf.text(`Rs. ${inv.subtotal.toFixed(2)}`, 65, y); y += 5;
    pdf.text(`GST (5%):`, 40, y); pdf.text(`Rs. ${inv.tax.toFixed(2)}`, 65, y); y += 5;
    pdf.setFont("helvetica", "bold");
    pdf.text(`TOTAL:`, 40, y); pdf.text(`Rs. ${inv.total.toFixed(2)}`, 65, y); y += 8;
    pdf.setFont("helvetica", "normal");
    pdf.text("Thank you for your purchase!", 40, y, { align: "center" });

    pdf.save(`${inv.invoiceNo}.pdf`);
    toast.success("Invoice downloaded");
  };

  return (
    <>
      <div className="page-header">
        <h2>Point of Sale</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: "0.78rem", color: "#6b7280" }}>Items in cart:</span>
          <span className="badge badge-green">{cart.reduce((a, c) => a + c.qty, 0)}</span>
        </div>
      </div>

      <div className="page-body" style={{ paddingTop: 20 }}>
        <div className="pos-layout">
          {/* Left: Medicine Search */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Barcode scanner input */}
            <div className="card">
              <div className="card-body" style={{ padding: "14px 18px" }}>
                <label className="form-label">Barcode Scanner</label>
                <input
                  ref={barcodeRef}
                  className="form-input"
                  style={{ fontFamily: "Space Mono, monospace" }}
                  placeholder="Scan barcode or type and press Enter…"
                  value={barcodeInput}
                  onChange={e => setBarcode(e.target.value)}
                  onKeyDown={handleBarcodeSearch}
                />
              </div>
            </div>

            {/* Medicine search */}
            <div className="card" style={{ flex: 1 }}>
              <div className="card-header">
                <div className="card-title">Medicine Search</div>
              </div>
              <div className="card-body">
                <div style={{ position: "relative", marginBottom: 16 }}>
                  <Search size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: 34 }}
                    placeholder="Type medicine name…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  {searchResults.map(med => (
                    <button
                      key={med.id}
                      onClick={() => addToCart(med)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 14px", borderRadius: 8, border: "1px solid #e5e7eb",
                        background: "#f9fafb", cursor: "pointer", textAlign: "left",
                        transition: "all 0.15s", fontFamily: "DM Sans, sans-serif", width: "100%",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f0fdf4"}
                      onMouseLeave={e => e.currentTarget.style.background = "#f9fafb"}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#111827" }}>{med.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{med.genericName} · SKU: {med.sku}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "Space Mono, monospace", fontWeight: 700, color: "#15803d" }}>
                          Rs. {med.unitPrice}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>Qty: {med.quantity}</div>
                      </div>
                    </button>
                  ))}

                  {search.length > 1 && searchResults.length === 0 && (
                    <div className="empty-state" style={{ padding: "24px 0" }}>
                      <Search size={32} />
                      <p>No medicines found</p>
                    </div>
                  )}

                  {search.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#d1d5db" }}>
                      <ShoppingCart size={48} style={{ marginBottom: 8, opacity: 0.4 }} />
                      <p style={{ fontSize: "0.85rem" }}>Search for a medicine to add to cart</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Cart */}
          <div className="card pos-cart">
            <div className="card-header">
              <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShoppingCart size={16} color="#15803d" /> Cart
              </div>
              {cart.length > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={() => setCart([])}>Clear all</button>
              )}
            </div>

            <div className="card-body" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div className="cart-items" style={{ flex: 1 }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#d1d5db" }}>
                    <ShoppingCart size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <p style={{ fontSize: "0.82rem" }}>Cart is empty</p>
                  </div>
                ) : cart.map(item => (
                  <div key={item.id} style={{
                    padding: "12px 0",
                    borderBottom: "1px solid #f3f4f6",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>{item.name}</div>
                        <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>Rs. {item.unitPrice} each</div>
                      </div>
                      <button className="btn btn-ghost btn-sm" style={{ padding: 4 }} onClick={() => removeFromCart(item.id)}>
                        <Trash2 size={13} color="#ef4444" />
                      </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontFamily: "Space Mono, monospace", fontSize: "0.85rem", fontWeight: 700, minWidth: 24, textAlign: "center" }}>{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span style={{ fontFamily: "Space Mono, monospace", fontWeight: 700, color: "#15803d" }}>
                        Rs. {(item.qty * item.unitPrice).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              {cart.length > 0 && (
                <div className="cart-footer">
                  <div className="cart-total-row">
                    <span>Subtotal</span>
                    <span style={{ fontFamily: "Space Mono, monospace" }}>Rs. {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="cart-total-row">
                    <span>GST (5%)</span>
                    <span style={{ fontFamily: "Space Mono, monospace" }}>Rs. {tax.toFixed(2)}</span>
                  </div>
                  <div className="cart-total-row grand">
                    <span>Total</span>
                    <span style={{ fontFamily: "Space Mono, monospace", color: "#15803d" }}>
                      Rs. {total.toFixed(2)}
                    </span>
                  </div>
                  <button
                    className="btn btn-primary btn-lg"
                    style={{ width: "100%", justifyContent: "center", marginTop: 16 }}
                    onClick={checkout}
                    disabled={processing}
                  >
                    {processing ? "Processing…" : "Complete Sale"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alternative medicine modal */}
      {altModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={18} color="#f59e0b" />
                Out of Stock — Alternatives
              </div>
            </div>
            <div className="modal-body">
              <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                <strong>{altModal.requested.name}</strong> is out of stock.
                The following same-salt alternatives are available:
              </div>
              {altModal.alternatives.map(alt => (
                <button
                  key={alt.id}
                  onClick={() => { addToCart(alt); setAltModal(null); }}
                  style={{
                    display: "flex", width: "100%", alignItems: "center",
                    justifyContent: "space-between", padding: "12px 14px",
                    borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb",
                    cursor: "pointer", marginBottom: 8, fontFamily: "DM Sans, sans-serif",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{alt.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Qty: {alt.quantity}</div>
                  </div>
                  <span className="badge badge-green">Rs. {alt.unitPrice}</span>
                </button>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAltModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice success modal */}
      {invoiceModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <div className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle size={18} color="#15803d" />
                Transaction Complete
              </div>
            </div>
            <div className="modal-body">
              <div className="alert alert-success" style={{ marginBottom: 16 }}>
                Invoice <strong>{invoiceModal.invoiceNo}</strong> generated successfully.
              </div>
              <div style={{ background: "#f9fafb", borderRadius: 8, padding: 16, fontFamily: "Space Mono, monospace", fontSize: "0.8rem" }}>
                {invoiceModal.items.map(item => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span>{item.name} × {item.qty}</span>
                    <span>Rs. {item.total}</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 8, paddingTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>GST (5%)</span><span>Rs. {invoiceModal.tax.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: 4, color: "#15803d" }}>
                    <span>TOTAL</span><span>Rs. {invoiceModal.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setInvoice(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => printInvoice(invoiceModal)}>
                <Printer size={14} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
