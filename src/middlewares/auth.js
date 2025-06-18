const jwt = require('jsonwebtoken');

// ✅ Auth Middleware
const isAuthenticated = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.unAuthorized({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded user object to req
    req.user = decoded; // should include id, email, role, and optionally permissions

    next();
  } catch (err) {
    return res.unAuthorized({ message: 'Invalid token' });
  }
};

// ✅ Role-Based Access Middleware
const hasRole = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole || !roles.includes(userRole)) {
      return res.unAuthorized({ message: 'Forbidden. You do not have access.' });
    }

    next();
  };
};

// ✅ Permission-Based Access Middleware
const hasPermission = (permission) => {
  return (req, res, next) => {
    const userPermissions = req.user?.permissions;

    if (!userPermissions || !userPermissions.includes(permission)) {
      return res.unAuthorized({ message: 'Forbidden. You do not have permission.' });
    }

    next();
  };
};

module.exports = {
  isAuthenticated,
  hasRole,
  hasPermission
};
