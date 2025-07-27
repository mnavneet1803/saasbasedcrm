const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Plan = require('../models/Plan');
const PaymentGateway = require('../models/PaymentGateway');

// Get available payment gateways for checkout
router.get('/gateways', auth, role(['admin']), async (req, res) => {
  try {
    const gateways = await PaymentGateway.find({ enabled: true }).select('name config');
    res.json(gateways);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Checkout
router.post('/checkout', auth, role('admin'), async (req, res) => {
  try {
    const { planId, gateway } = req.body;
    
    // Validate plan
    const plan = await Plan.findById(planId);
    if (!plan || !plan.active) {
      return res.status(400).json({ message: 'Invalid or inactive plan' });
    }
    
    // Validate gateway
    const gatewayDoc = await PaymentGateway.findOne({ name: gateway, enabled: true });
    if (!gatewayDoc) {
      return res.status(400).json({ message: 'Invalid or disabled payment gateway' });
    }
    
    // Check if admin already has an active plan
    const existingPlan = await User.findById(req.user.id).populate('plan');
    if (existingPlan.plan && existingPlan.status === 'active') {
      return res.status(400).json({ message: 'You already have an active subscription' });
    }
    
    // Generate transaction ID
    const transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9);
    
    // Create transaction
    const transaction = new Transaction({
      transactionId,
      admin: req.user.id,
      plan: planId,
      gateway: gateway,
      amount: plan.price,
      status: 'pending',
      details: {
        planName: plan.name,
        planFeatures: plan.features
      }
    });
    
    await transaction.save();
    
    // Mock payment gateway response
    const session = {
      id: transactionId,
      url: `/admin/payment-success?tx=${transaction._id}`,
      amount: plan.price,
      currency: 'INR'
    };
    
    res.json({ session });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Payment success
router.post('/success', auth, role('admin'), async (req, res) => {
  try {
    const { tx } = req.body;
    const transaction = await Transaction.findById(tx).populate('plan');
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    if (transaction.status === 'completed') {
      return res.json({ message: 'Payment already processed', transaction });
    }
    
    // Mark as completed
    transaction.status = 'completed';
    transaction.date = new Date();
    await transaction.save();
    
    // Assign plan to admin
    await User.findByIdAndUpdate(transaction.admin, { 
      plan: transaction.plan._id,
      status: 'active'
    });
    
    res.json({ 
      message: 'Payment successful', 
      transaction: {
        id: transaction._id,
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        gateway: transaction.gateway,
        planName: transaction.plan.name,
        status: transaction.status,
        date: transaction.date
      }
    });
  } catch (err) {
    console.error('Payment success error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Transaction history (admin)
router.get('/history', auth, role(['admin']), async (req, res) => {
  try {
    const transactions = await Transaction.find({ admin: req.user.id })
      .populate('plan')
      .sort({ date: -1 });
    
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Plan usage (superadmin)
router.get('/usage', auth, role('superadmin'), async (req, res) => {
  try {
    // List all admins and their plans
    const admins = await User.find({ role: 'admin' })
      .populate('plan')
      .select('name email plan status createdAt');
    
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all transactions (SuperAdmin)
router.get('/transactions', auth, role('superadmin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }
    if (req.query.gateway && req.query.gateway !== 'all') {
      filter.gateway = req.query.gateway;
    }
    
    // Date filter
    if (req.query.date && req.query.date !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (req.query.date) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }
      
      if (startDate) {
        filter.createdAt = { $gte: startDate };
      }
    }

    let transactions;
    let total;

    // Handle search separately to avoid issues with populated fields
    if (req.query.search && req.query.search.trim()) {
      const searchTerm = req.query.search.trim();
      
      // First, find users that match the search term
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } }
        ]
      }).select('_id');
      
      const userIds = matchingUsers.map(user => user._id);
      
      // Find plans that match the search term
      const matchingPlans = await Plan.find({
        name: { $regex: searchTerm, $options: 'i' }
      }).select('_id');
      
      const planIds = matchingPlans.map(plan => plan._id);
      
      // Build search filter
      const searchFilter = {
        ...filter,
        $or: [
          { transactionId: { $regex: searchTerm, $options: 'i' } },
          { admin: { $in: userIds } },
          { plan: { $in: planIds } }
        ]
      };
      
      transactions = await Transaction.find(searchFilter)
        .populate('admin', 'name email role')
        .populate('plan', 'name price features')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      total = await Transaction.countDocuments(searchFilter);
    } else {
      // No search term, use regular filter
      transactions = await Transaction.find(filter)
        .populate('admin', 'name email role')
        .populate('plan', 'name price features')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      total = await Transaction.countDocuments(filter);
    }

    const totalPages = Math.ceil(total / limit);

    res.json({
      transactions,
      total,
      totalPages,
      currentPage: page
    });
  } catch (err) {
    console.error('Transactions error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get payment statistics (SuperAdmin)
router.get('/stats', auth, role('superadmin'), async (req, res) => {
  try {
    const totalTransactions = await Transaction.countDocuments();
    const successfulPayments = await Transaction.countDocuments({ status: 'completed' });
    const pendingPayments = await Transaction.countDocuments({ status: 'pending' });
    
    // Calculate total revenue
    const revenueData = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;
    
    // Calculate monthly revenue
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthlyRevenueData = await Transaction.aggregate([
      { 
        $match: { 
          status: 'completed',
          createdAt: { $gte: startOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const monthlyRevenue = monthlyRevenueData.length > 0 ? monthlyRevenueData[0].total : 0;

    res.json({
      totalTransactions,
      successfulPayments,
      pendingPayments,
      totalRevenue,
      monthlyRevenue
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 