const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  date: { type: Date, default: Date.now },
  details: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema); 