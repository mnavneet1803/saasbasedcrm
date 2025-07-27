const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Get active plans for subscription (Admin) - MUST come before /:id route
router.get('/active', auth, role('admin'), async (req, res) => {
  try {
    const plans = await Plan.find({ active: true }).sort({ price: 1 });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all plans with optional filters (SuperAdmin)
router.get('/', auth, role('superadmin'), async (req, res) => {
  try {
    const { name, active } = req.query;
    let query = {};
    if (name) query.name = { $regex: name, $options: 'i' };
    if (active !== undefined && active !== "") query.active = active === 'true';
    const plans = await Plan.find(query).sort({ createdAt: -1 });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single plan
router.get('/:id', auth, role('superadmin'), async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create plan
router.post('/', auth, role('superadmin'), async (req, res) => {
  try {
    const { name, price, maxUsers, features, active } = req.body;
    const plan = new Plan({
      name,
      price,
      maxUsers,
      features: Array.isArray(features) ? features : features.split(',').map(f => f.trim()),
      active: active !== undefined ? active : true
    });
    await plan.save();
    res.status(201).json(plan);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update plan
router.put('/:id', auth, role('superadmin'), async (req, res) => {
  try {
    const { name, price, maxUsers, features, active } = req.body;
    const update = {
      name,
      price,
      maxUsers,
      features: Array.isArray(features) ? features : features.split(',').map(f => f.trim()),
      active
    };
    const plan = await Plan.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete plan
router.delete('/:id', auth, role('superadmin'), async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json({ message: 'Plan deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 