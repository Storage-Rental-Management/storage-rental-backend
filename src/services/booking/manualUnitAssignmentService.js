const bcrypt = require("bcryptjs");
const User = require("../../models/user");
const Booking = require("../../models/booking");
const StorageUnit = require("../../models/storageUnit");
const StorageProperty = require("../../models/storageProperty");
const Role = require("../../models/role");
const Payment = require("../../models/payment");
const { sendNotification } = require("../../resources/notification");
const {
  NOTIFICATION_TYPE,
  NOTIFICATION_PRIORITY,
} = require("../../constants/notificationEnums");
const {
  BOOKING_STATUS,
  STORAGE_UNIT_STATUS,
} = require("../../constants/databaseEnums");
const { dollarsToCents } = require("../../config/stripe");

module.exports = async (req, res) => {
  try {
    const {
      unitId,
      username,
      email,
      phone,
      paymentMethod,
      startDate,
      endDate,
      totalAmount,
    } = req.body;

    const adminId = req.user.id;

    // Validation
    if (!unitId || !username || !email || !phone || !paymentMethod) {
      return res.badRequest({
        message:
          "Missing required fields: unitId, username, email, phone, paymentMethod",
      });
    }

    // Check if unit exists and is available
    const storageUnit = await StorageUnit.findById(unitId);
    if (!storageUnit) {
      return res.recordNotFound({ message: "Storage unit not found" });
    }

    if (
      storageUnit.status !== STORAGE_UNIT_STATUS.AVAILABLE ||
      !storageUnit.isAvailable
    ) {
      return res.badRequest({
        message: "Storage unit is not available for assignment",
      });
    }

    // Check if user with this email already exists
    let existingUser = await User.findOne({ email: email.toLowerCase() });
    if (!existingUser) {
      // return res.badRequest({
      //   message: "User with this email already exists",
      // });
      const roles = await Role.find({ name: "User" });
      const hashedPassword = await bcrypt.hash(email.toLowerCase(), 10);
  
      // Create new user
      existingUser = new User({
        username,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone,
        isVerified: true,
        status: "Active",
        role: roles.length > 0 ? roles[0]._id : null, // Assign first role found
      });
  
      await existingUser.save();
    }


    // Get property ID from the storage unit
    const propertyId = storageUnit.propertyId;

    // Set startDate to now if not provided
    const bookingStartDate = startDate ? new Date(startDate) : new Date();
    // Set endDate to 1 year after startDate if not provided
    let bookingEndDate;
    if (endDate) {
      bookingEndDate = new Date(endDate);
    } else {
      bookingEndDate = new Date(bookingStartDate);
      bookingEndDate.setFullYear(bookingStartDate.getFullYear() + 1);
    }

    // Determine amount based on payment method if not provided or zero
    let finalAmount = totalAmount;
    if (!finalAmount || finalAmount === 0) {
      if (paymentMethod === "yearly") {
        finalAmount = storageUnit.yearlyCharge || 0;
      } else if (paymentMethod === "monthly") {
        finalAmount = storageUnit.monthlyCharge || 0;
      } else {
        finalAmount = 0;
      }
    }

    // Create booking
    const newBooking = new Booking({
      customerId: existingUser._id,
      unitId: storageUnit._id,
      propertyId: propertyId,
      startDate: bookingStartDate,
      endDate: bookingEndDate,
      // totalAmount: finalAmount,
      isManualAssign: true,
      paymentStatus: "pending",
      payment_period: paymentMethod,
      bookingStatus: BOOKING_STATUS.BOOKING_CONFIRMED,
    });

    await newBooking.save();

    // Create Payment record for manual payment
    // const paymentData = {
    //   transactionId: `MANUAL-${newBooking._id}-${Date.now()}`,
    //   bookingId: newBooking._id,
    //   payerId: existingUser._id,
    //   receiverId: adminId,
    //   unitId: storageUnit._id,
    //   propertyId: propertyId,
    //   amount: dollarsToCents(finalAmount),
    //   currency: "inr",
    //   paymentMethod: paymentMethod,
    //   paymentPeriod: paymentMethod,
    //   baseAmount: dollarsToCents(finalAmount),
    //   platformFee: 0,
    //   stripeFee: 0,
    //   netAmount: dollarsToCents(finalAmount),
    //   commission: 0,
    //   status: "pending",
    //   paymentType: "payment",
    //   paymentDate: bookingStartDate,
    //   invoiceLink: "", // No Stripe receipt for manual payment
    //   description: "Manual payment on manual unit assignment",
    // };
    // await Payment.create(paymentData);

    // Update storage unit status to occupied
    if (storageUnit.status !== STORAGE_UNIT_STATUS.OCCUPIED) {
      await StorageUnit.findByIdAndUpdate(unitId, {
        status: STORAGE_UNIT_STATUS.OCCUPIED,
        isAvailable: false,
        updatedAt: new Date(),
      });

      await StorageProperty.findByIdAndUpdate(propertyId, {
        $inc: { activeCount: 1 },
      });
    }

    // Fetch the updated unit data for response
    const updatedUnit = await StorageUnit.findById(unitId);

    const admin = await User.findById(req.user.id);
    const property = await StorageProperty.findById(storageUnit.propertyId);

    // Send notification to the assigned user
    try {
      await sendNotification({
        recipientId: existingUser._id,
        title: "Storage Unit Assigned",
        message: `Hi ${
          existingUser.username
        }, you have been assigned the storage unit ${storageUnit.name} at ${
          property?.companyName || "N/A"
        }" by ${
          admin?.username || "an admin"
        } on ${new Date().toLocaleDateString()}. Please check your account for details and next steps.`,
        group: "Booking",
        type: NOTIFICATION_TYPE.BOOKING_CONFIRMED,
        priority: NOTIFICATION_PRIORITY.HIGH,
        metadata: {
          bookingId: newBooking._id,
          unitId: storageUnit._id,
          propertyId: propertyId,
        },
        isAction: false,
        isActionCompleted: false,
      });
    } catch (notificationError) {
      console.error("Notification failed:", notificationError.message);
    }

    return res.success({
      message: "Storage unit assigned successfully",
      data: {
        user: {
          id: existingUser._id,
          username: existingUser.username,
          email: existingUser.email,
          phone: existingUser.phone,
        },
        booking: {
          id: newBooking._id,
          status: newBooking.bookingStatus,
          paymentStatus: newBooking.paymentStatus,
          payment_period: newBooking.payment_period,
        },
        unit: {
          id: updatedUnit._id,
          name: updatedUnit.name,
          status: updatedUnit.status,
        },
      },
    });
  } catch (error) {
    return res.internalServerError({
      message: "Failed to assign storage unit",
      data: { errors: error.message },
    });
  }
};
