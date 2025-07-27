const mongoose = require('mongoose');

const paymentGatewaySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g., 'razorpay', 'stripe'
  enabled: { type: Boolean, default: false },
  config: { type: Object, default: {} }, // for storing keys/settings
}, { timestamps: true });

module.exports = mongoose.model('PaymentGateway', paymentGatewaySchema); 