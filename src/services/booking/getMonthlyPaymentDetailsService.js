const {
  BOOKING_STATUS,
  STORAGE_UNIT_STATUS,
} = require("../../constants/databaseEnums");
const Booking = require("../../models/booking");
const Payment = require("../../models/payment");
const StorageUnit = require("../../models/storageUnit");
const moment = require("moment");

module.exports = async (req, res) => {
  try {
    const { bookingId } = req.query;

    // Fetch booking
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.notFound({ message: "Booking not found" });

    // Unit assigned check
    if (!booking.unitId) {
      return res.success({
        message: "No unit assigned for this booking.",
        data: [],
      });
    }

    if (![BOOKING_STATUS.DOCUMENTS_APPROVED, BOOKING_STATUS.BOOKING_CONFIRMED].includes(booking?.bookingStatus)) {
      return res.success({
        message: "Booking documents not verified yet.",
        data: [],
      });
    }

    // Booking Expired Check
    if ([BOOKING_STATUS.BOOKING_EXPIRED, BOOKING_STATUS.BOOKING_CANCELLED].includes(booking?.bookingStatus)) {
      return res.success({
        message: "Unit booking expired.",
        data: [],
      });
    }

    // Fetch unit rent
    const unit = await StorageUnit.findById(booking.unitId);
    if (!unit) return res.notFound({ message: "Storage unit not found" });

    // Unit occupied check
    // if (unit.status !== STORAGE_UNIT_STATUS.OCCUPIED) {
    //   return res.success({
    //     message: "Payment details available only for occupied units.",
    //     data: [],
    //   });
    // }
    const monthlyCharge = unit.monthlyCharge;

    // Fetch all payments for this booking
    const payments = await Payment.find({
      bookingId,
      status: { $in: ["paid", "succeeded"] },
      paymentType: "payment",
    });
    console.log("🚀 ~ payments:", payments)

    let monthlyDetails = [];

    if (booking.payment_period === "yearly") {
      // ---- YEARLY PAYMENT CASE ----
      const start = moment(booking.startDate).startOf("month");
      const end = moment(booking.endDate).endOf("month");
      let current = start.clone();

      // Check if yearly payment has been made
      const yearlyPayment = payments.find((p) => p.paymentPeriod === "yearly");
      const hasYearlyPayment = !!yearlyPayment;

      while (current.isSameOrBefore(end, "month")) {
        const monthName = current.format("MMMM");
        const year = current.format("YYYY");

        let status = "Pending";
        let paymentDate = "--";
        let invoiceLink = null;

        if (hasYearlyPayment) {
          // If yearly payment is made, all months are marked as paid
          status = "Paid";
          paymentDate = moment(yearlyPayment.paymentDate).format("DD MMM YYYY");
          invoiceLink = yearlyPayment.invoiceLink || null;
        }

        monthlyDetails.push({
          month: `${monthName} ${year}`,
          paymentDate,
          amountPaid: monthlyCharge,
          paymentStatus: status,
          invoiceLink,
        });

        current.add(1, "month");
      }
    } else {
      // ---- MONTHLY PAYMENT CASE ----
      const start = moment(booking.startDate).startOf("month");
      const end = moment(booking.endDate).endOf("month");
      let current = start.clone();
      const now = moment();

      const monthlyPayments = payments.filter(
        (p) => p.paymentPeriod === "monthly"
      );

      while (current.isSameOrBefore(end, "month")) {
        const monthName = current.format("MMMM");
        const year = current.format("YYYY");

        // Find payment for this specific month
        const paidMonth = monthlyPayments.find((p) =>
          moment(p.paymentDate).isSame(current, "month")
        );

        let status = "Upcoming";
        let paymentDate = "--";
        let invoiceLink = null;

        if (paidMonth) {
          // ✅ Paid month
          status = "Paid";
          paymentDate = moment(paidMonth.paymentDate).format("DD MMM YYYY");
          invoiceLink = paidMonth.invoiceLink || null;
        } else if (current.isSame(now, "month")) {
          // 🕒 Current month unpaid → Pending
          status = "Pending";
        } else if (current.isBefore(now, "month")) {
          // 🚨 Past month unpaid → Overdue Pending
          status = "Overdue";
        } else {
          // ⌛ Future month → Upcoming
          status = "Upcoming";
        }

        monthlyDetails.push({
          month: `${monthName} ${year}`,
          paymentDate,
          amountPaid: monthlyCharge,
          paymentStatus: status,
          invoiceLink,
        });

        current.add(1, "month");
      }
    }

    return res.success({ data: monthlyDetails });
  } catch (error) {
    return res.internalServerError({ message: error.message });
  }
};
