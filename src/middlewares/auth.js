const jwt = require("jsonwebtoken");
const User = require('../models/user');
const { ROLES } = require("../constants/databaseEnums");


// ✅ Auth Middleware
const isAuthenticated = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.unAuthorized({ message: "No token provided" });
  }

  const token = authHeader?.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ message: "Token missing from Authorization header" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    const admin = await User.findById(req.user.id)
      .populate('subscriptionId role');
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    if (admin.role.name === ROLES.ADMIN && (admin.createdAt < sixMonthsAgo) && (!admin.subscriptionId || admin.subscriptionStatus !== 'active')) {
      return res.unAuthorized({ 
        message: 'Active subscription required to access this feature' 
      });
    }

    next();
  } catch (err) {
    return res.unAuthorized({ message: "Invalid token" });
  }
};

// ✅ Role-Based Access Middleware
const hasRole = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole || !roles.includes(userRole)) {
      return res.unAuthorized({
        message: "Forbidden. You do not have access.",
      });
    }
    next();
  };
};

// ✅ Permission-Based Access Middleware
const hasPermission = (permission) => {
  return (req, res, next) => {
    const userPermissions = req.user?.permissions;

    if (!userPermissions || !userPermissions.includes(permission)) {
      return res.unAuthorized({
        message: "Forbidden. You do not have permission.",
      });
    }

    next();
  };
};

module.exports = {
  isAuthenticated,
  hasRole,
  hasPermission,
};
