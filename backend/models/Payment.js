const mongoose = require('mongoose');
const PaymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'pending' }, // pending, approved, rejected, done
  sum: Number,
  currency: String,
  comment: String,
  purpose: String,
  contract: String,
  swift: String,
  recipientAccount: String,
  recipientName: String,
  recipientAddress: String,
  recipientCountry: String,
  paymentType: String,
  docs: [String], // массив файлов (пути)
  rate: Number,
  dateIn: Date,
  feePercent: Number,
  history: [Object],
  adminComment: String,
}, { timestamps: true });
module.exports = mongoose.model('Payment', PaymentSchema);