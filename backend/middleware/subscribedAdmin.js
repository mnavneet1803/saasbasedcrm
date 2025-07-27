const User = require('../models/User');

module.exports = async function (req, res, next) {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden: Only admins' });
    const admin = await User.findById(req.user.id);
    if (!admin || admin.status !== 'active' || !admin.plan) {
      return res.status(403).json({ message: 'You must have an active subscription to access this feature.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 