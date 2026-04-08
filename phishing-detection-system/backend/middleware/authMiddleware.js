const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized. No token.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-change-in-production');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User not found.' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized. Invalid token.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
};

const rootAdminOnly = (req, res, next) => {
  const rootEmail = (process.env.ROOT_ADMIN_EMAIL || '').toLowerCase().trim();
  if (!rootEmail) {
    return res.status(500).json({ message: 'ROOT_ADMIN_EMAIL is not configured.' });
  }
  if ((req.user?.email || '').toLowerCase() !== rootEmail) {
    return res.status(403).json({ message: 'Root admin access required.' });
  }
  next();
};

module.exports = { protect, adminOnly, rootAdminOnly };
