const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  brandName: { type: String, required: true, index: true },
  saltName: { type: String, required: true, index: true },
  strength: { type: String, required: true },
  form: { type: String, default: "Tablet" },
  price: { type: Number, required: true },
  packSize: { type: String, default: "10 Tablets" },
  isGeneric: { type: Boolean, required: true, default: false },
  manufacturer: { type: String, default: "Generic / Govt" }
}, { timestamps: true });

module.exports = mongoose.model('Medicine', medicineSchema);