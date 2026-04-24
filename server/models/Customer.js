const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    preferredLanguage: {
      type: String,
      enum: ['english', 'hindi', 'kannada', 'marathi', null],
      default: null,
    },
    customerId: {
      type: String,
      unique: true,
      sparse: true,
    },
    // Adding relations to orders if needed
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Customer', customerSchema);
