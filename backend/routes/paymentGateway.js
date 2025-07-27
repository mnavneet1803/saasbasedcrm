const express = require('express');
const router = express.Router();
const PaymentGateway = require('../models/PaymentGateway');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// List all gateways (SuperAdmin)
router.get('/', auth, role('superadmin'), async (req, res) => {
  try {
    const gateways = await PaymentGateway.find().sort({ name: 1 });
    res.json(gateways);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active gateways (Admin)
router.get('/active', auth, role('admin'), async (req, res) => {
  try {
    const gateways = await PaymentGateway.find({ enabled: true }).select('name config');
    res.json(gateways);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create gateway
router.post('/', auth, role('superadmin'), async (req, res) => {
  try {
    const { name, enabled, config } = req.body;
    
    // Check if gateway with same name already exists
    const existingGateway = await PaymentGateway.findOne({ name: name.toLowerCase() });
    if (existingGateway) {
      return res.status(400).json({ message: 'Gateway with this name already exists' });
    }

    // If enabling this gateway, disable all others first
    if (enabled) {
      await PaymentGateway.updateMany({}, { enabled: false });
    }

    const gateway = new PaymentGateway({ 
      name: name.toLowerCase(), 
      enabled: enabled || false, 
      config: config || {} 
    });
    await gateway.save();
    res.status(201).json(gateway);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update gateway (enable/disable/config)
router.put('/:id', auth, role('superadmin'), async (req, res) => {
  try {
    const { name, enabled, config } = req.body;
    
    // If enabling this gateway, disable all others first
    if (enabled) {
      await PaymentGateway.updateMany({}, { enabled: false });
    }
    
    const gateway = await PaymentGateway.findByIdAndUpdate(
      req.params.id, 
      { name, enabled, config }, 
      { new: true }
    );
    if (!gateway) return res.status(404).json({ message: 'Gateway not found' });
    res.json(gateway);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle gateway status
router.patch('/:id/toggle', auth, role('superadmin'), async (req, res) => {
  try {
    const gateway = await PaymentGateway.findById(req.params.id);
    if (!gateway) return res.status(404).json({ message: 'Gateway not found' });
    
    // If enabling this gateway, disable all others first
    if (!gateway.enabled) {
      await PaymentGateway.updateMany({}, { enabled: false });
    }
    
    gateway.enabled = !gateway.enabled;
    await gateway.save();
    
    res.json(gateway);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete gateway
router.delete('/:id', auth, role('superadmin'), async (req, res) => {
  try {
    const gateway = await PaymentGateway.findByIdAndDelete(req.params.id);
    if (!gateway) return res.status(404).json({ message: 'Gateway not found' });
    res.json({ message: 'Gateway deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 