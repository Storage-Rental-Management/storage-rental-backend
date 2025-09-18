const User = require("../../models/user");
const Role = require("../../models/role");
const bcrypt = require("bcryptjs");
const { generateOtp } = require("../../resources/utils");
const { sendOtpEmail } = require("../../resources/emailUtils");
const { registerSchema } = require("../../validation/authValidation");
const otp = require("../../models/otp");
const { sendNotification } = require("../../resources/notification");
const { NOTIFICATION_TYPE, NOTIFICATION_PRIORITY } = require("../../constants/notificationEnums");
const { ROLES } = require("../../constants/databaseEnums");

module.exports = async (req, res) => {
  try {
    const { error, value } = await registerSchema.validate(req.body);
    if (error) {
      return res.validationError({ message: error.details[0].message });
    }

    const { username, email, phone, password, fcm_token } = value;

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.badRequest({ message: "Email already registered" });
    }

    let role;
    if (req.body.role && req.body.role === "Admin") {
      role = await Role.findOne({ name: "Admin" });
    } else {
      role = await Role.findOne({ name: "User" });
    }

    if (!role) {
      return res.internalServerError({ message: "Role configuration error" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      phone,
      password: hashedPassword,
      role: role._id,
      isVerified: false,
      fcm_token: fcm_token || null,
    });

    const { otpCode, otpExpiry } = generateOtp();

    await otp.create({
      email,
      otp: otpCode,
      expiresAt: otpExpiry,
    });

    // Send OTP email
    await sendOtpEmail(email, otpCode, username);

    // console.log("Role", req.body.role)
    // Send notification to all superadmins when an admin registers
    if (req.body.role === "Admin") {
      try {
        // Find the super admin user (since only one exists)
        const superAdminRole = await Role.findOne({ name: ROLES.SUPER_ADMIN });
        if (superAdminRole) {
          const superAdmin = await User.findOne({ role: superAdminRole._id });
          if (superAdmin) {
            await sendNotification({
              recipientId: superAdmin._id,
              title: "New Admin Registration",
              message: `A new admin (${username}) has registered with email: ${email}`,
              group: "User",
              type: NOTIFICATION_TYPE.NEW_USER_REGISTRATION,
              priority: NOTIFICATION_PRIORITY.HIGH,
              metadata: {
                newUserId: user._id,
                newUserEmail: email,
                newUserRole: "Admin"
              },
              isAction: false
            });
          }
        }
      } catch (notificationError) {
        // Log the error but don't fail the registration
        console.error("Failed to send admin registration notification:", notificationError.message);
      }
    }

    return res.success({
      message: "Verification OTP sent to your email address",
      data: {},
    });
  } catch (error) {
    return res.internalServerError({
      message: "Registration failed",
      data: { errors: error.message },
    });
  }
};
