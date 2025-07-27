const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Plan = require('../models/Plan');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const bcrypt = require('bcryptjs');

// Get all admins with search/filter
router.get('/', auth, role('superadmin'), async (req, res) => {
  try {
    const { name, email, status, plan } = req.query;
    let query = { role: 'admin' };
    if (name) query.name = { $regex: name, $options: 'i' };
    if (email) query.email = { $regex: email, $options: 'i' };
    if (status) query.status = status;
    if (plan) query.plan = plan;
    const admins = await User.find(query).populate('plan').sort({ createdAt: -1 });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create admin
router.post('/', auth, role('superadmin'), async (req, res) => {
  try {
    const { name, email, password, plan } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new User({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      plan,
      status: 'active',
    });
    await admin.save();
    res.status(201).json(await admin.populate('plan'));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update admin (name, email, password, plan)
router.put('/:id', auth, role('superadmin'), async (req, res) => {
  try {
    const { name, email, password, plan } = req.body;
    const update = { name, email };
    if (password) update.password = await bcrypt.hash(password, 10);
    if (plan) update.plan = plan;
    const admin = await User.findByIdAndUpdate(req.params.id, update, { new: true }).populate('plan');
    res.json(admin);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Block/Unblock admin
router.patch('/:id/status', auth, role('superadmin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const admin = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('plan');
    res.json(admin);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete admin
router.delete('/:id', auth, role('superadmin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Admin deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 