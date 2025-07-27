const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const bcrypt = require('bcryptjs');

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('plan').populate('createdBy', 'name email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Return user data without password
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      plan: user.plan,
      createdAt: user.createdAt,
      createdBy: user.createdBy // populated admin
    };
    res.json(userData);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (SuperAdmin only)
router.get('/', auth, async (req, res) => {
  try {
    const { role, limit, adminId } = req.query;
    
    if (req.user.role === 'superadmin') {
      const filter = {};
      if (role) { filter.role = role; }
      if (adminId) { filter.createdBy = adminId; }
      let query = User.find(filter).populate('plan').populate('createdBy', 'name email');
      if (limit) { query = query.limit(parseInt(limit)); }
      const users = await query.sort({ createdAt: -1 });
      res.json({ users });
    } else if (req.user.role === 'admin') {
      const users = await User.find({ createdBy: req.user.id }).populate('plan');
      res.json({ users });
    } else {
      res.status(403).json({ message: 'Access denied' });
    }
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create user (admin or superadmin)
router.post('/', auth, role(['superadmin', 'admin']), async (req, res) => {
  try {
    const { name, email, password, role: userRole } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: userRole || 'user',
      createdBy: req.user.role === 'admin' ? req.user.id : undefined,
    });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (SuperAdmin only)
router.put('/:id', auth, role('superadmin'), async (req, res) => {
  try {
    const { name, email, phone, status } = req.body;
    const userId = req.params.id;
    
    // Check if user exists
    const user = await User.findById(userId);
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
    ).select('-password').populate('createdBy', 'name email');
    
    res.json({ 
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle user status (SuperAdmin only)
router.patch('/:id/toggle-status', auth, role('superadmin'), async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const user = await User.findById(userId);
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

// Reset user password (SuperAdmin only)
router.patch('/:id/reset-password', auth, role('superadmin'), async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.params.id;
    
    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
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

// Get user activities (SuperAdmin only)
router.get('/:id/activities', auth, role('superadmin'), async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Placeholder for user activities
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

// Delete user
router.delete('/:id', auth, role(['superadmin', 'admin']), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Transfer user to another admin (SuperAdmin only)
router.patch('/:id/transfer', auth, role('superadmin'), async (req, res) => {
  try {
    const { targetAdminId } = req.body;
    const userId = req.params.id;
    
    if (!targetAdminId) {
      return res.status(400).json({ message: 'Target admin ID is required' });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if target admin exists
    const targetAdmin = await User.findById(targetAdminId);
    if (!targetAdmin || targetAdmin.role !== 'admin') {
      return res.status(404).json({ message: 'Target admin not found' });
    }
    
    // Update user's createdBy field
    user.createdBy = targetAdminId;
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({ 
      message: `User transferred to ${targetAdmin.name} successfully`,
      user: userResponse
    });
  } catch (err) {
    console.error('Transfer user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create user under specific admin (SuperAdmin only)
router.post('/', auth, role('superadmin'), async (req, res) => {
  try {
    const { name, email, phone, password, status, role: userRole, createdBy } = req.body;
    
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    // Check if target admin exists (if specified)
    if (createdBy) {
      const targetAdmin = await User.findById(createdBy);
      if (!targetAdmin || targetAdmin.role !== 'admin') {
        return res.status(400).json({ message: 'Target admin not found' });
      }
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = new User({
      name,
      email,
      phone: phone || '',
      password: hashedPassword,
      role: userRole || 'user',
      status: status || 'active',
      createdBy: createdBy || null
    });
    
    await user.save();
    
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

// Get users by specific admin (SuperAdmin only)
router.get('/by-admin/:adminId', auth, role('superadmin'), async (req, res) => {
  try {
    const adminId = req.params.adminId;
    
    // Check if admin exists
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Get users created by this admin
    const users = await User.find({ 
      createdBy: adminId,
      role: 'user'
    }).populate('plan').sort({ createdAt: -1 });
    
    res.json({ users });
  } catch (err) {
    console.error('Get users by admin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 