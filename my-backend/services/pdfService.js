const PDFDocument = require("pdfkit");

/**
 * Generates a professional PDF invoice and pipes it to a writable stream (e.g., Express res).
 * @param {Object} invoice - Populated invoice document
 * @param {WritableStream} outputStream - Express res or any writable stream
 */
function buildInvoicePdf(invoice, outputStream) {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(outputStream);

    const garageName = invoice.garage?.name || "SmartAuto Service Center";
    const garageAddress = invoice.garage?.address || "Service Center Address";
    const garagePhone = invoice.garage?.phone || "N/A";

    const customerName = invoice.customer?.name || "Customer";
    const customerPhone = invoice.customer?.mobile || "N/A";
    const customerEmail = invoice.customer?.email || "N/A";

    const vehiclePlate = invoice.vehicle?.vehicleNumber || "N/A";
    const vehicleModel = invoice.vehicle ? `${invoice.vehicle.brand} ${invoice.vehicle.model}` : "Vehicle";
    const vehicleFuel = invoice.vehicle?.fuelType || "N/A";

    const mechanicName = invoice.mechanic?.name || "Assigned Service Team";

    const invoiceNumber = invoice.invoiceNumber || `INV-${new Date().getFullYear()}-${String(invoice._id).slice(-6).toUpperCase()}`;
    const invoiceDate = invoice.finalizedAt || invoice.createdAt || new Date();
    const formattedDate = new Date(invoiceDate).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });

    // 1. Header with styling
    doc.rect(0, 0, doc.page.width, 95).fill("#0f172a");

    doc.fillColor("#ffffff").fontSize(20).font("Helvetica-Bold").text(garageName, 40, 25);
    doc.fillColor("#94a3b8").fontSize(10).font("Helvetica").text(`${garageAddress}  |  Phone: ${garagePhone}`, 40, 52);
    doc.fillColor("#38bdf8").fontSize(11).font("Helvetica-Bold").text("TAX INVOICE / SERVICE BILL", 40, 70);

    // 2. Metadata / Invoice Info
    doc.fillColor("#0f172a");
    let currentY = 115;

    // Left Column: Bill To (Customer) & Vehicle Info
    doc.fontSize(11).font("Helvetica-Bold").text("CUSTOMER & VEHICLE DETAILS", 40, currentY);
    doc.font("Helvetica").fontSize(10).fillColor("#334155");
    doc.text(`Customer: ${customerName}`, 40, currentY + 18);
    doc.text(`Mobile: ${customerPhone}  |  Email: ${customerEmail}`, 40, currentY + 32);
    doc.text(`Vehicle: ${vehicleModel} (${vehicleFuel})`, 40, currentY + 46);
    doc.text(`Plate No: ${vehiclePlate}`, 40, currentY + 60);

    // Right Column: Invoice Details & Mechanic
    const rightX = 350;
    doc.fillColor("#0f172a").fontSize(11).font("Helvetica-Bold").text("INVOICE METADATA", rightX, currentY);
    doc.font("Helvetica").fontSize(10).fillColor("#334155");
    doc.text(`Invoice No: ${invoiceNumber}`, rightX, currentY + 18);
    doc.text(`Date: ${formattedDate}`, rightX, currentY + 32);
    doc.text(`Mechanic: ${mechanicName}`, rightX, currentY + 46);
    doc.text(`Payment Status: ${(invoice.paymentStatus || "PENDING").toUpperCase()}`, rightX, currentY + 60);

    // 3. Line Items Table Header
    currentY = 205;
    doc.rect(40, currentY, doc.page.width - 80, 24).fill("#f1f5f9");

    doc.fillColor("#1e293b").font("Helvetica-Bold").fontSize(10);
    doc.text("Description", 50, currentY + 7);
    doc.text("Category", 250, currentY + 7);
    doc.text("Qty", 345, currentY + 7, { width: 40, align: "right" });
    doc.text("Rate", 400, currentY + 7, { width: 55, align: "right" });
    doc.text("Amount", 470, currentY + 7, { width: 65, align: "right" });

    currentY += 28;
    doc.font("Helvetica").fontSize(9).fillColor("#334155");

    const items = invoice.items && invoice.items.length > 0 ? invoice.items : [
        {
            description: invoice.booking?.service?.name || "General Vehicle Service",
            category: "service",
            quantity: 1,
            unitPrice: invoice.serviceCharges || invoice.total || 0,
            amount: invoice.serviceCharges || invoice.total || 0
        }
    ];

    items.forEach((item, index) => {
        const rowBg = index % 2 === 1 ? "#fafafa" : "#ffffff";
        doc.rect(40, currentY - 3, doc.page.width - 80, 20).fill(rowBg);

        doc.fillColor("#1e293b");
        doc.text(item.description || "Service Item", 50, currentY);
        doc.text((item.category || "service").toUpperCase(), 250, currentY);
        doc.text(String(item.quantity || 1), 345, currentY, { width: 40, align: "right" });
        doc.text(`Rs. ${(item.unitPrice || 0).toFixed(2)}`, 400, currentY, { width: 55, align: "right" });
        doc.text(`Rs. ${(item.amount || 0).toFixed(2)}`, 470, currentY, { width: 65, align: "right" });

        currentY += 20;
    });

    // Divider line
    doc.moveTo(40, currentY + 5).lineTo(doc.page.width - 40, currentY + 5).strokeColor("#cbd5e1").stroke();
    currentY += 15;

    // 4. Financial Summary
    const summaryX = 330;
    const summaryWidth = doc.page.width - 40 - summaryX;

    const subtotal = invoice.subtotal || invoice.total || 0;
    const discount = invoice.discount || 0;
    const taxable = invoice.taxableAmount !== undefined ? invoice.taxableAmount : (subtotal - discount);
    const gstRate = invoice.gstPercentage !== undefined ? invoice.gstPercentage : 18;
    const cgst = invoice.cgstAmount || 0;
    const sgst = invoice.sgstAmount || 0;
    const totalGst = invoice.gstAmount || (cgst + sgst) || 0;
    const grandTotal = invoice.totalAmount || invoice.total || (taxable + totalGst);

    doc.font("Helvetica").fontSize(9).fillColor("#334155");

    if (invoice.labourCharges > 0) {
        doc.text("Labour Charges:", summaryX, currentY);
        doc.text(`Rs. ${invoice.labourCharges.toFixed(2)}`, summaryX, currentY, { width: summaryWidth, align: "right" });
        currentY += 16;
    }

    if (invoice.otherCharges > 0) {
        doc.text("Other Charges:", summaryX, currentY);
        doc.text(`Rs. ${invoice.otherCharges.toFixed(2)}`, summaryX, currentY, { width: summaryWidth, align: "right" });
        currentY += 16;
    }

    doc.text("Subtotal:", summaryX, currentY);
    doc.text(`Rs. ${subtotal.toFixed(2)}`, summaryX, currentY, { width: summaryWidth, align: "right" });
    currentY += 16;

    if (discount > 0) {
        doc.text("Discount:", summaryX, currentY);
        doc.text(`- Rs. ${discount.toFixed(2)}`, summaryX, currentY, { width: summaryWidth, align: "right" });
        currentY += 16;
    }

    doc.text("Taxable Value:", summaryX, currentY);
    doc.text(`Rs. ${taxable.toFixed(2)}`, summaryX, currentY, { width: summaryWidth, align: "right" });
    currentY += 16;

    if (gstRate > 0) {
        doc.text(`CGST (${(gstRate / 2).toFixed(1)}%):`, summaryX, currentY);
        doc.text(`Rs. ${cgst.toFixed(2)}`, summaryX, currentY, { width: summaryWidth, align: "right" });
        currentY += 16;

        doc.text(`SGST (${(gstRate / 2).toFixed(1)}%):`, summaryX, currentY);
        doc.text(`Rs. ${sgst.toFixed(2)}`, summaryX, currentY, { width: summaryWidth, align: "right" });
        currentY += 16;
    }

    // Grand Total Box
    doc.rect(summaryX - 10, currentY + 2, summaryWidth + 10, 26).fill("#0284c7");
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#ffffff");
    doc.text("GRAND TOTAL:", summaryX, currentY + 9);
    doc.text(`Rs. ${grandTotal.toFixed(2)}`, summaryX, currentY + 9, { width: summaryWidth, align: "right" });

    // 5. Notes & Sign-off Footer
    const notesY = Math.max(currentY + 45, 680);
    if (invoice.notes) {
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#0f172a").text("Service Notes:", 40, notesY);
        doc.font("Helvetica").fontSize(9).fillColor("#475569").text(invoice.notes, 40, notesY + 14, { width: 450 });
    }

    doc.rect(0, doc.page.height - 45, doc.page.width, 45).fill("#f8fafc");
    doc.font("Helvetica").fontSize(9).fillColor("#64748b").text(
        `Thank you for servicing your vehicle with ${garageName}! For queries, contact ${garagePhone}.`,
        40,
        doc.page.height - 30,
        { align: "center", width: doc.page.width - 80 }
    );

    doc.end();
}

module.exports = { buildInvoicePdf };
