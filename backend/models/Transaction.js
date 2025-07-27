const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
  gateway: { type: String, required: true }, // e.g., 'razorpay', 'stripe'
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'cancelled'], default: 'pending' },
  date: { type: Date, default: Date.now },
  details: { type: Object, default: {} },
  gatewayResponse: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema); 