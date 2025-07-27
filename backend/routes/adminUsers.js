const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const User = require('../models/User');
const subscribedAdmin = require('../middleware/subscribedAdmin');

// Get all users created by the admin
router.get('/users', auth, role('admin'), subscribedAdmin, async (req, res) => {
  try {
    const users = await User.find({ 
      createdBy: req.user.id,
      role: 'user'
    }).select('-password').sort({ createdAt: -1 });
    
    res.json({ users });
  } catch (err) {
    console.error('Get admin users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new user (admin only)
router.post('/users', auth, role('admin'), subscribedAdmin, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const user = new User({
      name,
      email,
      phone: phone || '',
      password: hashedPassword,
      role: 'user',
      createdBy: req.user.id,
      status: 'active'
    });
    
    await user.save();
    
    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({ 
      message: 'User created successfully',
      user: userResponse
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (admin only)
router.put('/users/:id', auth, role('admin'), subscribedAdmin, async (req, res) => {
  try {
    const { name, email, phone, status } = req.body;
    const userId = req.params.id;
    
    // Check if user exists and belongs to this admin
    const user = await User.findOne({ 
      _id: userId, 
      createdBy: req.user.id,
      role: 'user'
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }
    }
    
    // Update user
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (status) updateData.status = status;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');
    
    res.json({ 
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle user status (activate/deactivate)
router.patch('/users/:id/toggle-status', auth, role('admin'), subscribedAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists and belongs to this admin
    const user = await User.findOne({ 
      _id: userId, 
      createdBy: req.user.id,
      role: 'user'
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Toggle status
    user.status = user.status === 'active' ? 'blocked' : 'active';
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({ 
      message: `User ${user.status === 'active' ? 'activated' : 'deactivated'} successfully`,
      user: userResponse
    });
  } catch (err) {
    console.error('Toggle user status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset user password
router.patch('/users/:id/reset-password', auth, role('admin'), subscribedAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.params.id;
    
    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }
    
    // Check if user exists and belongs to this admin
    const user = await User.findOne({ 
      _id: userId, 
      createdBy: req.user.id,
      role: 'user'
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user activities (placeholder for future implementation)
router.get('/users/:id/activities', auth, role('admin'), subscribedAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists and belongs to this admin
    const user = await User.findOne({ 
      _id: userId, 
      createdBy: req.user.id,
      role: 'user'
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Placeholder for user activities
    // In a real application, you would fetch activities from a separate collection
    const activities = [
      {
        id: 1,
        type: 'login',
        description: 'User logged in',
        timestamp: new Date(),
        details: { ip: '192.168.1.1', userAgent: 'Chrome/91.0' }
      },
      {
        id: 2,
        type: 'lead_created',
        description: 'Created new lead',
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        details: { leadId: 'LEAD001', leadName: 'John Doe' }
      }
    ];
    
    res.json({ activities });
  } catch (err) {
    console.error('Get user activities error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 