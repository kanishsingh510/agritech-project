const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    paymentStatus: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
    orderId: { type: String },
    paymentId: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);







