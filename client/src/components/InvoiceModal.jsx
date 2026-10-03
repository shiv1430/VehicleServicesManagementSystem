import React from "react";

const InvoiceModal = ({ invoice, onClose, onDownload }) => {
  if (!invoice) return null;

  const handleDownload = () => {
    if (onDownload) {
      onDownload(invoice._id, invoice.invoiceNumber);
    } else {
      // Default download trigger
      const token = localStorage.getItem("token");
      const url = `http://localhost:3000/api/invoices/${invoice._id}/download`;
      fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => res.blob())
        .then(blob => {
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = downloadUrl;
          a.download = `Invoice-${invoice.invoiceNumber || invoice._id}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        })
        .catch(err => console.error("Error downloading PDF:", err));
    }
  };

  const invoiceNum = invoice.invoiceNumber || `INV-${String(invoice._id).slice(-6).toUpperCase()}`;
  const dateStr = new Date(invoice.finalizedAt || invoice.createdAt).toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  const items = invoice.items && invoice.items.length > 0 ? invoice.items : [
    {
      description: invoice.booking?.service?.name || "Vehicle Service",
      category: "service",
      quantity: 1,
      unitPrice: invoice.serviceCharges || invoice.total || 0,
      amount: invoice.serviceCharges || invoice.total || 0
    }
  ];

  const subtotal = invoice.subtotal || invoice.total || 0;
  const discount = invoice.discount || 0;
  const taxable = invoice.taxableAmount !== undefined ? invoice.taxableAmount : (subtotal - discount);
  const totalGst = invoice.gstAmount || invoice.tax || 0;
  const grandTotal = invoice.totalAmount || invoice.total || (taxable + totalGst);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container invoice-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ margin: 0 }}>Service Bill &amp; Tax Invoice</h2>
            <p className="text-muted" style={{ margin: "4px 0 0 0" }}>
              Official Tax Invoice: <strong>{invoiceNum}</strong>
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-body invoice-modal-body">
          {/* Top Info Banner */}
          <div className="invoice-header-banner">
            <div className="garage-info">
              <h3>{invoice.garage?.name || "Service Station"}</h3>
              <p>{invoice.garage?.address || "Service Center"}</p>
              {invoice.garage?.phone && <p>📞 {invoice.garage.phone}</p>}
            </div>
            <div className="invoice-meta-info" style={{ textAlign: "right" }}>
              <span className={`badge ${invoice.status === "finalized" ? "badge-status-completed" : "badge-status-pending"}`}>
                ● {(invoice.status || "finalized").toUpperCase()}
              </span>
              <p style={{ margin: "6px 0 2px 0" }}>Date: <strong>{dateStr}</strong></p>
              <p style={{ margin: 0 }}>Payment: <strong>{(invoice.paymentStatus || "Pending").toUpperCase()}</strong></p>
            </div>
          </div>

          {/* Customer & Vehicle Grid */}
          <div className="invoice-parties-grid">
            <div className="invoice-party-box">
              <span className="party-title">CUSTOMER DETAILS</span>
              <strong>{invoice.customer?.name || "Customer"}</strong>
              {invoice.customer?.mobile && <div>Phone: {invoice.customer.mobile}</div>}
              {invoice.customer?.email && <div>Email: {invoice.customer.email}</div>}
            </div>

            <div className="invoice-party-box">
              <span className="party-title">VEHICLE DETAILS</span>
              <strong>
                {invoice.vehicle ? `${invoice.vehicle.brand} ${invoice.vehicle.model}` : "Vehicle"}
              </strong>
              {invoice.vehicle?.vehicleNumber && (
                <div>Plate: <strong>{invoice.vehicle.vehicleNumber}</strong></div>
              )}
              {invoice.vehicle?.fuelType && <div>Fuel: {invoice.vehicle.fuelType}</div>}
            </div>

            <div className="invoice-party-box">
              <span className="party-title">SERVICED BY</span>
              <strong>{invoice.mechanic?.name || "Service Team"}</strong>
              {invoice.mechanic?.mobile && <div>Phone: {invoice.mechanic.mobile}</div>}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="invoice-table-wrapper">
            <table className="invoice-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Description</th>
                  <th style={{ textAlign: "center" }}>Category</th>
                  <th style={{ textAlign: "right" }}>Qty</th>
                  <th style={{ textAlign: "right" }}>Rate (₹)</th>
                  <th style={{ textAlign: "right" }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td>{it.description}</td>
                    <td style={{ textAlign: "center" }}>
                      <span className="badge badge-default" style={{ fontSize: "0.75rem" }}>
                        {(it.category || "service").toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>{it.quantity}</td>
                    <td style={{ textAlign: "right" }}>₹{(it.unitPrice || 0).toFixed(2)}</td>
                    <td style={{ textAlign: "right", fontWeight: "bold" }}>
                      ₹{(it.amount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Calculation Box */}
          <div className="invoice-summary-grid">
            <div className="invoice-notes-area">
              {invoice.notes && (
                <>
                  <span className="party-title">SERVICE NOTES</span>
                  <p className="invoice-notes-text">{invoice.notes}</p>
                </>
              )}
            </div>

            <div className="invoice-totals-box">
              {invoice.labourCharges > 0 && (
                <div className="total-row">
                  <span>Labour Charges:</span>
                  <span>₹{invoice.labourCharges.toFixed(2)}</span>
                </div>
              )}
              {invoice.otherCharges > 0 && (
                <div className="total-row">
                  <span>Other Charges:</span>
                  <span>₹{invoice.otherCharges.toFixed(2)}</span>
                </div>
              )}
              <div className="total-row">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="total-row text-success">
                  <span>Discount:</span>
                  <span>- ₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="total-row">
                <span>Taxable Amount:</span>
                <span>₹{taxable.toFixed(2)}</span>
              </div>
              {invoice.gstPercentage > 0 && (
                <>
                  <div className="total-row text-muted">
                    <span>CGST ({(invoice.gstPercentage / 2).toFixed(1)}%):</span>
                    <span>₹{(invoice.cgstAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="total-row text-muted">
                    <span>SGST ({(invoice.gstPercentage / 2).toFixed(1)}%):</span>
                    <span>₹{(invoice.sgstAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="total-row">
                    <span>Total GST ({invoice.gstPercentage}%):</span>
                    <span>₹{totalGst.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="total-row grand-total-row">
                <strong>Grand Total:</strong>
                <strong className="grand-total-val">₹{grandTotal.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn-primary" onClick={handleDownload}>
            ⬇️ Download PDF Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
