const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  companyName: String,
  directorName: String,
  inn: String,
  address: String,
  bankName: String,
  bik: String,
  accountNumber: String,
  contactPhone: String,
  isVerified: { type: Boolean, default: false },
  emailToken: { type: String }
}, { timestamps: true });
module.exports = mongoose.model('User', UserSchema);