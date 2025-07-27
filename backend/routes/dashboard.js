const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const Transaction = require('../models/Transaction'); // Added missing import

// Get dashboard stats for SuperAdmin
router.get('/stats', auth, role('superadmin'), async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Basic stats
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeSubscriptions = await User.countDocuments({ role: 'admin', status: 'active', plan: { $exists: true, $ne: null } });
    
    // Payment stats
    const totalPayments = await Transaction.countDocuments();
    const successfulPayments = await Transaction.countDocuments({ status: 'completed' });
    const pendingPayments = await Transaction.countDocuments({ status: 'pending' });
    const revenueData = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;
    const monthlyRevenueData = await Transaction.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const monthlyRevenue = monthlyRevenueData.length > 0 ? monthlyRevenueData[0].total : 0;

    // User statistics
    const activeUsers = await User.countDocuments({ role: 'user', status: 'active' });
    const inactiveUsers = await User.countDocuments({ role: 'user', status: 'blocked' });
    const totalUserActivities = 0; // Placeholder for future implementation

    // Phase 3.5: Admin-User relationship stats
    const adminsWithUsers = await User.aggregate([
      { $match: { role: 'admin' } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'createdBy',
          as: 'users'
        }
      },
      { $match: { 'users.0': { $exists: true } } },
      { $count: 'count' }
    ]);
    const totalAdminsWithUsers = adminsWithUsers.length > 0 ? adminsWithUsers[0].count : 0;

    // Calculate average users per admin
    const averageUsersPerAdmin = totalAdmins > 0 ? (totalUsers / totalAdmins).toFixed(1) : 0;

    // User growth rate (users created this month vs last month)
    const thisMonthUsers = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: startOfMonth }
    });
    const lastMonthStart = new Date(startOfMonth);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    const lastMonthUsers = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: lastMonthStart, $lt: startOfMonth }
    });
    const userGrowthRate = lastMonthUsers > 0 ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(1) : 0;

    // User activity rate (users who have logged in at least once)
    const usersWithLogin = await User.countDocuments({
      role: 'user',
      lastLogin: { $exists: true, $ne: null }
    });
    const userActivityRate = totalUsers > 0 ? ((usersWithLogin / totalUsers) * 100).toFixed(1) : 0;

    res.json({
      totalAdmins,
      totalUsers,
      totalPayments,
      activeSubscriptions,
      successfulPayments,
      pendingPayments,
      totalRevenue,
      monthlyRevenue,
      activeUsers,
      totalUserActivities,
      // Phase 3.5 stats
      totalAdminsWithUsers,
      averageUsersPerAdmin,
      userGrowthRate,
      inactiveUsers,
      userActivityRate
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 