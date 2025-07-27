const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  maxUsers: { type: Number, required: true },
  features: [{ type: String }],
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema); 