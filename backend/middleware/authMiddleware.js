const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyToken = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (!decoded.id) return null;
  return User.findById(decoded.id).select('-password');
};

const protect = async (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    req.user = await verifyToken(token);
    if (!req.user) return res.status(401).json({ message: 'Account no longer exists' });
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired authentication token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin, verifyToken };
