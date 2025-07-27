const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  role: { type: String, enum: ['superadmin', 'admin', 'user'], default: 'user' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // for admin's users
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema); 