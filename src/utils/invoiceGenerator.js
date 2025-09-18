const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const generateInvoicePDF = async (payment, monthlyPayment = null) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 45, size: "A4" });

      // 📂 Ensure invoices folder exists
      const invoicesDir = path.join(__dirname, "../../uploads/invoices");
      fs.mkdirSync(invoicesDir, { recursive: true });

      // Generate filename based on payment type
      let fileName;
      if (payment.paymentPeriod === "monthly" && monthlyPayment?.month) {
        fileName = `invoice_${
          payment.transactionId || "monthly"
        }_${monthlyPayment.month.replace(" ", "_")}.pdf`;
      } else if (payment.paymentPeriod === "yearly") {
        fileName = `invoice_${payment.transactionId || "yearly"}_annual.pdf`;
      } else {
        fileName = `invoice_${payment.transactionId || Date.now()}.pdf`;
      }

      const filePath = path.join(invoicesDir, fileName);

      // Pipe PDF into file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Determine payment type and extract relevant data
      const isMonthlyPlan = payment.paymentPeriod === "monthly";
      const isYearlyPlan = payment.paymentPeriod === "yearly";
      const isSuperAdminPayment = !payment.payerId && !payment.unitId;

      // For monthly plans, use the specific monthly payment data if provided
      const invoiceData = {
        transactionId: payment.transactionId || "",
        date:
          monthlyPayment?.paymentDate ||
          payment.paymentDate ||
          payment.createdAt ||
          new Date(),
        customer: isSuperAdminPayment
          ? "N/A"
          : payment.payerId?.username || "N/A",
        customerId: isSuperAdminPayment
          ? "N/A"
          : payment.payerId?._id || payment.payerId || "N/A",
        customerEmail: isSuperAdminPayment
          ? "N/A"
          : payment.payerId?.email || "N/A",
        paymentMethod: payment.paymentMethod || "N/A",

        // Amount handling based on payment plan
        amount:
          isMonthlyPlan && monthlyPayment
            ? monthlyPayment.amountPaid || payment.amount || 0
            : isYearlyPlan
            ? payment.amount || 0
            : payment.amount || 0,

        status: monthlyPayment?.paymentStatus || payment.status || "N/A",
        unitType: isSuperAdminPayment
          ? "N/A"
          : payment.unitId?.unitType || "N/A",
        unitName: isSuperAdminPayment ? "N/A" : payment.unitId?.name || "N/A",
        property: payment.propertyId?.name || "N/A",
        reference: payment.transactionId || "N/A",
        currency: payment.currency?.toUpperCase() || "INR",

        // Plan-specific data
        paymentPlan: isMonthlyPlan
          ? "Monthly Plan"
          : isYearlyPlan
          ? "Yearly Plan"
          : "N/A",
        billingPeriod:
          isMonthlyPlan && monthlyPayment?.month
            ? monthlyPayment.month
            : isYearlyPlan
            ? `${new Date().getFullYear()} Annual`
            : "",

        // Booking period for yearly plans
        serviceStartDate: payment.bookingStartDate || "N/A",
        serviceEndDate: payment.bookingEndDate || "N/A",

        // Fee breakdown
        baseAmount: payment.baseAmount || 0,
        platformFee: payment.platformFee || 0,
        stripeFee: payment.stripeFee || 0,
        netAmount: payment.netAmount || payment.amount || 0,
      };

      // Colors
      const primaryColor = "#000000";
      const secondaryColor = "#4D4A4A";
      const orangeColor = "#C95B22";
      const lightGray = "#f8fafc";
      const darkGray = "#334155";

      // Helper functions
      const drawLine = (x1, y1, x2, y2, color = "#e2e8f0") => {
        doc
          .strokeColor(color)
          .lineWidth(1)
          .moveTo(x1, y1)
          .lineTo(x2, y2)
          .stroke();
      };

      const drawRect = (x, y, width, height, fillColor, strokeColor) => {
        if (fillColor) {
          doc
            .rect(x, y, width, height)
            .fillAndStroke(fillColor, strokeColor || fillColor);
        } else if (strokeColor) {
          doc.rect(x, y, width, height).stroke(strokeColor);
        }
      };

      let currentY = 25;

      // --- Header Section ---
      drawRect(50, currentY, 100, 60);

      // Try to load logo, fallback to text
      const logoPath = path.join(__dirname, "../../public/logo.png");
      try {
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, currentY, { width: 100 });
        } else {
          throw new Error("Logo not found");
        }
      } catch (error) {
        // If logo fails to load, show placeholder text
        doc
          .fillColor(primaryColor)
          .fontSize(12)
          .font("Helvetica-Bold")
          .text("123 SELF", 60, currentY + 20)
          .text("STORAGE", 60, currentY + 35);
      }

      // Company Info
      doc
        .fillColor(secondaryColor)
        .fontSize(10)
        .font("Helvetica")
        .text("123 Industrial Area, Sector 5", 200, currentY + 25, {
          align: "right",
        })
        .text("Ahmedabad, Gujarat - 380015", 200, currentY + 38, {
          align: "right",
        })
        .text("Phone: +91 9876543210", 200, currentY + 51, { align: "right" })
        .text("Email: info@bookmystorage.com", 200, currentY + 64, {
          align: "right",
        });

      currentY += 80;

      // --- Invoice Title ---
      drawRect(50, currentY, 495, 40);
      const invoiceTitle = isMonthlyPlan
        ? "MONTHLY PAYMENT INVOICE"
        : isYearlyPlan
        ? "ANNUAL PAYMENT INVOICE"
        : "PAYMENT INVOICE";

      doc
        .fillColor(primaryColor)
        .fontSize(21)
        .font("Helvetica-Bold")
        .text(invoiceTitle, 50, currentY + 12, { align: "center", width: 495 });

      currentY += 60;

      // --- Invoice Details Section ---
      const invoiceDetailsY = currentY;

      // Left side - Invoice Info
      doc
        .fillColor(darkGray)
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Invoice Details", 50, currentY);

      currentY += 20;

      doc
        .fillColor(secondaryColor)
        .fontSize(10)
        .font("Helvetica")
        .text(`Invoice No:`, 50, currentY)
        .fillColor(darkGray)
        .font("Helvetica-Bold")
        .text(
          `TXN-${invoiceData.transactionId.slice(-4).toUpperCase() || "XXXX"}`,
          120,
          currentY
        );

      currentY += 15;

      doc
        .fillColor(secondaryColor)
        .font("Helvetica")
        .text(`Invoice Date:`, 50, currentY)
        .fillColor(darkGray)
        .font("Helvetica-Bold")
        .text(
          `${new Date(invoiceData.date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}`,
          120,
          currentY
        );

      currentY += 15;

      // Billing Period
      doc
        .fillColor(secondaryColor)
        .font("Helvetica")
        .text(`Billing Period:`, 50, currentY)
        .fillColor(darkGray)
        .font("Helvetica-Bold")
        .text(`${invoiceData.billingPeriod}`, 120, currentY);

      currentY += 15;

      doc
        .fillColor(secondaryColor)
        .font("Helvetica")
        .text(`Payment Plan:`, 50, currentY)
        .fillColor(darkGray)
        .font("Helvetica-Bold")
        .text(`${invoiceData.paymentPlan}`, 120, currentY);

      // Right side - Customer Info
      const rightX = 300;
      let rightY = invoiceDetailsY;

      doc
        .fillColor(darkGray)
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Bill To", rightX, rightY);

      rightY += 15;

      // Customer info box
      drawRect(rightX, rightY, 245, 70, lightGray, "#e2e8f0");

      doc
        .fillColor(darkGray)
        .fontSize(11)
        .font("Helvetica-Bold")
        .text(`${invoiceData.customer}`, rightX + 15, rightY + 15);

      doc
        .fillColor(secondaryColor)
        .fontSize(10)
        .font("Helvetica")
        .text(
          `Customer ID: ${invoiceData.customerId}`,
          rightX + 15,
          rightY + 35
        )
        .text(`Email: ${invoiceData.customerEmail}`, rightX + 15, rightY + 50);

      currentY += 46;

      // --- Service Details ---
      if (!isSuperAdminPayment && invoiceData.unitType !== "N/A") {
        doc
          .fillColor(darkGray)
          .fontSize(12)
          .font("Helvetica-Bold")
          .text("Service Details", 50, currentY);

        currentY += 20;

        const serviceBoxHeight = 40;
        drawRect(50, currentY, 495, serviceBoxHeight, lightGray, "#e2e8f0");

        // Column widths
        const col1X = 70; // Storage Unit
        const col2X = 220; // Unit Type
        const col3X = 370; // Service Period

        const rowY1 = currentY + 15;

        // --- Column 1: Storage Unit ---
        doc
          .fillColor(secondaryColor)
          .fontSize(10)
          .font("Helvetica")
          .text("Storage Unit:", col1X, rowY1)
          .fillColor(darkGray)
          .font("Helvetica-Bold")
          .fontSize(11)
          .text(`${invoiceData.unitName}`, col1X + 70, rowY1);

        // --- Column 2: Unit Type ---
        doc
          .fillColor(secondaryColor)
          .fontSize(10)
          .font("Helvetica")
          .text("Unit Type:", col2X, rowY1)
          .fillColor(darkGray)
          .font("Helvetica-Bold")
          .fontSize(11)
          .text(`${invoiceData.unitType}`, col2X + 50, rowY1);

        // --- Column 3: Service Period (only for yearly plan) ---
        if (isYearlyPlan && invoiceData.serviceStartDate !== "N/A") {
          doc
            .fillColor(secondaryColor)
            .fontSize(10)
            .font("Helvetica")
            .text("Service Period:", col3X, rowY1)
            .fillColor(darkGray)
            .font("Helvetica-Bold")
            .fontSize(11)
            .text(
              `${new Date(
                invoiceData.serviceStartDate
              ).toLocaleDateString()} - ${new Date(
                invoiceData.serviceEndDate
              ).toLocaleDateString()}`,
              col3X + 80,
              rowY1
            );
        }

        currentY += serviceBoxHeight + 18;
      }

      // --- Payment Summary Table ---
      doc
        .fillColor(darkGray)
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Payment Summary", 50, currentY);

      currentY += 25;

      const tableWidth = 495;
      const rowHeight = 32;

      // --- Header row ---
      drawRect(50, currentY, tableWidth, rowHeight, lightGray, "#e2e8f0");
      doc
        .fillColor("black")
        .fontSize(11)
        .font("Helvetica-Bold")
        .text("Description", 70, currentY + 12)
        .text("Amount", 400, currentY + 12, { align: "right", width: 125 });

      currentY += rowHeight;

      // --- Build rows ---
      const tableData = [];
      const currencySymbol = "$";

      if (isMonthlyPlan) {
        tableData.push({
          description: `Monthly Storage Fee - ${invoiceData.billingPeriod}`,
          amount: `${currencySymbol}${(invoiceData.amount / 100).toFixed(2)}`,
        });
      } else if (isYearlyPlan) {
        const yearlyTotal = (invoiceData.amount * 12) / 100;
        tableData.push({
          description: `Annual Storage Fee - ${invoiceData.billingPeriod} (12 months)`,
          amount: `${currencySymbol}${yearlyTotal.toFixed(2)}`,
        });
      } else {
        tableData.push({
          description: `Storage Service - ${invoiceData.unitName}`,
          amount: `${currencySymbol}${(invoiceData.amount / 100).toFixed(2)}`,
        });
      }

      // if (invoiceData.platformFee > 0) {
      //   tableData.push({
      //     description: "Platform Fee",
      //     amount: `${currencySymbol}${(invoiceData.platformFee / 100).toFixed(
      //       2
      //     )}`,
      //   });
      // }

      // if (invoiceData.stripeFee > 0) {
      //   tableData.push({
      //     description: "Processing Fee",
      //     amount: `${currencySymbol}${(invoiceData.stripeFee / 100).toFixed(
      //       2
      //     )}`,
      //   });
      // }

      // --- GST row (if any) ---
      const taxableAmount = isYearlyPlan
        ? invoiceData.amount * 12
        : invoiceData.amount;
      // const taxAmount = taxableAmount * 0.18;
      // if (taxAmount > 0) {
      //   tableData.push({
      //     description: "GST (18%)",
      //     amount: `${currencySymbol}${(taxAmount / 100).toFixed(2)}`,
      //   });
      // }

      // --- Table rows with border ---
      tableData.forEach((row, index) => {
        const bgColor = index % 2 === 0 ? "#ffffff" : lightGray;
        drawRect(50, currentY, tableWidth, rowHeight, bgColor, "#e2e8f0");

        doc
          .moveTo(390, currentY)
          .lineTo(390, currentY + rowHeight)
          .strokeColor("#e2e8f0")
          .lineWidth(1)
          .stroke();

        doc
          .fillColor(secondaryColor)
          .fontSize(10)
          .font("Helvetica")
          .text(row.description, 70, currentY + 12)
          .text(row.amount, 400, currentY + 12, { align: "right", width: 125 });

        currentY += rowHeight;
      });

      // --- Total row ---
      drawRect(50, currentY, tableWidth, rowHeight, orangeColor, "#e2e8f0");
      // const totalAmount = taxableAmount + taxAmount;
      const totalAmount = taxableAmount;

      doc
        .fillColor("white")
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Total Amount", 70, currentY + 12)
        .text(
          `${currencySymbol}${(totalAmount / 100).toFixed(2)}`,
          400,
          currentY + 12,
          {
            align: "right",
            width: 125,
          }
        );

      currentY += rowHeight + 10;

      // --- Status Badge ---
      const getStatusColor = (status) => {
        const s = status.toLowerCase();
        if (
          s === "completed" ||
          s === "success" ||
          s === "succeeded" ||
          s === "paid"
        )
          return "#10b981"; // green
        if (s === "pending" || s === "processing") return "#f59e0b"; // yellow
        return "#ef4444"; // red
      };

      const statusColor = getStatusColor(invoiceData.status);
      const displayStatus =
        invoiceData.status.toLowerCase() === "succeeded"
          ? "PAID"
          : invoiceData.status.toUpperCase();

      doc
        .fillColor("gray")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Payment Status:", 50, currentY + 8, { continued: true });

      doc
        .fillColor(statusColor)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(` ${displayStatus}`);

      currentY += 25;

      // --- Transaction Details ---
      if (invoiceData.transactionId) {
        doc
          .fillColor(secondaryColor)
          .fontSize(9)
          .font("Helvetica")
          .text(`Transaction ID:  ${invoiceData.transactionId}`, 50, currentY)
          .text(`Reference:  ${invoiceData.reference}`, 50, currentY + 12)
          .text(
            `Payment Method:  ${invoiceData.paymentMethod}`,
            50,
            currentY + 24
          );

        currentY += 25;
      }
      
      if (payment.description) {
        doc
          .fillColor(secondaryColor)
          .fontSize(9)
          .font("Helvetica")
          .text(`Info:`, 50, currentY + 24)
          .text(`${payment.description}`, 50, currentY + 24);

        currentY += 25;
      }

      // --- Footer Section ---
      const pageHeight = doc.page.height;
      const footerY = pageHeight - 150;

      drawLine(50, footerY - 10, 545, footerY - 10);

      const termsText = isYearlyPlan
        ? "• This invoice covers the full annual storage service period.\n• Payment is non-refundable unless specified otherwise."
        : "• This is a monthly billing invoice for storage services.\n• Payment is due by the end of the billing period.";

      // Terms & Conditions
      doc
        .fillColor(secondaryColor)
        .fontSize(9)
        .font("Helvetica")
        .text("Terms & Conditions:", 50, footerY)
        .text(
          "• This is a computer generated invoice and does not require signature.",
          50,
          footerY + 15
        )
        .text(termsText, 50, footerY + 28, { width: 495 })
        .text(
          "• For queries, contact support@bookmystorage.com",
          50,
          footerY + 54
        )
        .text("• GST Registration: 24ABCDE1234F1Z5", 50, footerY + 67);

      // Thank you message (always last line above bottom margin)
      doc
        .fillColor(darkGray)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("Thank you for choosing 123 Self Storage!", 0, pageHeight - 60, {
          align: "right",
          width: doc.page.width - 80,
        });

      doc.end();

      stream.on("finish", () => {
        const invoiceUrl = `/uploads/invoices/${fileName}`;
        resolve(invoiceUrl);
      });

      stream.on("error", (err) => reject(err));
    } catch (error) {
    console.log("🚀 ~ generateInvoicePDF ~ error:", error)

      reject(error);
    }
  });
};

module.exports = { generateInvoicePDF };
