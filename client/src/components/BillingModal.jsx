import React, { useState, useEffect } from "react";
import api from "../services/api";
import AlertBanner from "./AlertBanner";

const PREDEFINED_CATEGORIES = [
  { value: "service", label: "Service / Inspection" },
  { value: "part", label: "Spare Part / Material" },
  { value: "labour", label: "Labour Work" },
  { value: "other", label: "Other Charges" },
];

const BillingModal = ({ booking, onClose, onSuccess }) => {
  const [items, setItems] = useState([
    {
      description: booking?.service?.name || "General Service",
      category: "service",
      quantity: 1,
      unitPrice: booking?.service?.price || 1200,
    },
  ]);
  const [labourCharges, setLabourCharges] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [gstPercentage, setGstPercentage] = useState(18);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch existing draft invoice if any
  useEffect(() => {
    if (!booking?._id) return;
    const fetchExistingInvoice = async () => {
      try {
        const res = await api.get(`/api/invoices/booking/${booking._id}`);
        if (res.data) {
          const inv = res.data;
          if (inv.items && inv.items.length > 0) {
            setItems(inv.items.map(i => ({
              description: i.description,
              category: i.category || "service",
              quantity: i.quantity || 1,
              unitPrice: i.unitPrice || 0,
            })));
          }
          setLabourCharges(inv.labourCharges || 0);
          setOtherCharges(inv.otherCharges || 0);
          setDiscount(inv.discount || 0);
          setGstPercentage(inv.gstPercentage !== undefined ? inv.gstPercentage : 18);
          setNotes(inv.notes || "");
        }
      } catch {
        // No existing invoice is normal for new bookings
      }
    };

    fetchExistingInvoice();
  }, [booking?._id]);

  // Line item manipulation
  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { description: "", category: "part", quantity: 1, unitPrice: 0 },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      setError("The invoice must contain at least one line item.");
      return;
    }
    setError("");
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Live Calculations for Preview (Backend will strictly recompute and validate)
  const itemsTotal = items.reduce((acc, it) => {
    const q = Math.max(0, Number(it.quantity) || 0);
    const p = Math.max(0, Number(it.unitPrice) || 0);
    return acc + q * p;
  }, 0);

  const subtotal = itemsTotal + (Number(labourCharges) || 0) + (Number(otherCharges) || 0);
  const safeDiscount = Math.min(Number(discount) || 0, subtotal);
  const taxableAmount = Math.max(0, subtotal - safeDiscount);
  const gstRate = Number(gstPercentage) || 0;
  const gstAmount = Math.round(taxableAmount * (gstRate / 100) * 100) / 100;
  const cgstAmount = Math.round((gstAmount / 2) * 100) / 100;
  const sgstAmount = Math.round((gstAmount - cgstAmount) * 100) / 100;
  const grandTotal = Math.round((taxableAmount + gstAmount) * 100) / 100;

  const handleSubmit = async (finalize = false) => {
    setError("");

    // Front-end sanity checks
    for (let i = 0; i < items.length; i++) {
      if (!items[i].description.trim()) {
        setError(`Item #${i + 1} is missing a description.`);
        return;
      }
      if (Number(items[i].quantity) <= 0) {
        setError(`Item #${i + 1} quantity must be at least 1.`);
        return;
      }
      if (Number(items[i].unitPrice) < 0) {
        setError(`Item #${i + 1} unit price cannot be negative.`);
        return;
      }
    }

    if (Number(discount) < 0) {
      setError("Discount cannot be negative.");
      return;
    }
    if (Number(discount) > subtotal) {
      setError("Discount cannot exceed subtotal.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        bookingId: booking._id,
        items: items.map((it) => ({
          description: it.description.trim(),
          category: it.category,
          quantity: Number(it.quantity) || 1,
          unitPrice: Number(it.unitPrice) || 0,
        })),
        labourCharges: Number(labourCharges) || 0,
        otherCharges: Number(otherCharges) || 0,
        discount: Number(discount) || 0,
        gstPercentage: Number(gstPercentage),
        notes: notes.trim(),
        finalize,
      };

      const res = await api.post("/api/invoices", payload);
      if (onSuccess) {
        onSuccess(res.data, finalize);
      }
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to save invoice. Please review all fields."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container billing-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 style={{ margin: 0 }}>Prepare Service Bill / Final Invoice</h2>
            <p className="text-muted" style={{ margin: "4px 0 0 0" }}>
              Customer: <strong>{booking?.customer?.name}</strong> | Vehicle:{" "}
              <strong>
                {booking?.vehicle?.brand} {booking?.vehicle?.model} (
                {booking?.vehicle?.vehicleNumber})
              </strong>
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-body billing-modal-body">
          <AlertBanner type="error" message={error} onClose={() => setError("")} />

          {/* Section 1: Line Items Table */}
          <div className="form-section">
            <div className="section-title-bar">
              <h4>Work Done &amp; Spare Parts Used</h4>
              <button
                type="button"
                className="btn-outline-sm"
                onClick={handleAddItem}
                disabled={submitting}
              >
                + Add Item
              </button>
            </div>

            <div className="items-table-wrapper">
              <table className="billing-items-table">
                <thead>
                  <tr>
                    <th style={{ width: "38%" }}>Description *</th>
                    <th style={{ width: "22%" }}>Category</th>
                    <th style={{ width: "12%" }}>Qty *</th>
                    <th style={{ width: "16%" }}>Rate (₹) *</th>
                    <th style={{ width: "12%" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Synthetic Oil 5W30"
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(idx, "description", e.target.value)
                          }
                          required
                        />
                      </td>
                      <td>
                        <select
                          className="form-control"
                          value={item.category}
                          onChange={(e) =>
                            handleItemChange(idx, "category", e.target.value)
                          }
                        >
                          {PREDEFINED_CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(idx, "quantity", e.target.value)
                          }
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          step="10"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemChange(idx, "unitPrice", e.target.value)
                          }
                          required
                        />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="btn-danger-sm"
                          onClick={() => handleRemoveItem(idx)}
                          title="Remove item"
                          disabled={items.length <= 1}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Additional Charges & Tax Inputs */}
          <div className="billing-form-grid">
            <div className="charges-inputs">
              <div className="form-group-inline">
                <label>Labour Charges (₹):</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={labourCharges}
                  onChange={(e) => setLabourCharges(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group-inline">
                <label>Other / Diagnostic Charges (₹):</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={otherCharges}
                  onChange={(e) => setOtherCharges(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group-inline">
                <label>Discount Amount (₹):</label>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="form-control"
                />
              </div>

              <div className="form-group-inline">
                <label>Applicable GST Rate:</label>
                <select
                  value={gstPercentage}
                  onChange={(e) => setGstPercentage(Number(e.target.value))}
                  className="form-control"
                >
                  <option value={0}>0% (Exempt)</option>
                  <option value={5}>5% GST</option>
                  <option value={12}>12% GST</option>
                  <option value={18}>18% GST (Standard Automobile)</option>
                  <option value={28}>28% GST</option>
                </select>
              </div>

              <div className="form-group" style={{ marginTop: "12px" }}>
                <label>Mechanic Notes / Recommendations:</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Brake pads inspected and replaced. Recommended tyre rotation in 5000 kms."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-control"
                />
              </div>
            </div>

            {/* Live Calculation Preview Card */}
            <div className="bill-preview-box">
              <span className="party-title">LIVE BILL SUMMARY PREVIEW</span>
              <div className="preview-row">
                <span>Items Subtotal:</span>
                <span>₹{itemsTotal.toFixed(2)}</span>
              </div>
              {Number(labourCharges) > 0 && (
                <div className="preview-row">
                  <span>Labour Charges:</span>
                  <span>₹{Number(labourCharges).toFixed(2)}</span>
                </div>
              )}
              {Number(otherCharges) > 0 && (
                <div className="preview-row">
                  <span>Other Charges:</span>
                  <span>₹{Number(otherCharges).toFixed(2)}</span>
                </div>
              )}
              <div className="preview-row" style={{ fontWeight: 600 }}>
                <span>Gross Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {Number(discount) > 0 && (
                <div className="preview-row text-success">
                  <span>Discount:</span>
                  <span>- ₹{safeDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="preview-row">
                <span>Taxable Amount:</span>
                <span>₹{taxableAmount.toFixed(2)}</span>
              </div>
              {gstRate > 0 && (
                <>
                  <div className="preview-row text-muted">
                    <span>CGST ({(gstRate / 2).toFixed(1)}%):</span>
                    <span>₹{cgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="preview-row text-muted">
                    <span>SGST ({(gstRate / 2).toFixed(1)}%):</span>
                    <span>₹{sgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="preview-row">
                    <span>Total GST ({gstRate}%):</span>
                    <span>₹{gstAmount.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="preview-total-row">
                <span>Grand Total:</span>
                <strong>₹{grandTotal.toFixed(2)}</strong>
              </div>
              <small className="text-muted" style={{ display: "block", marginTop: "8px" }}>
                * Final values will be verified and recalculated by server before saving.
              </small>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
          >
            {submitting ? "Saving..." : "💾 Save Draft Bill"}
          </button>
          <button
            type="button"
            className="btn-success"
            onClick={() => handleSubmit(true)}
            disabled={submitting}
          >
            {submitting ? "Finalizing..." : "✅ Finalize Bill & Complete Service"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingModal;
