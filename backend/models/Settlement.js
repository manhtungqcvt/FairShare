const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true
  },
  payer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vui lòng xác định người thanh toán (người nợ)']
  },
  payee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vui lòng xác định người nhận tiền (chủ nợ)']
  },
  amount: {
    type: Number,
    required: [true, 'Vui lòng nhập số tiền thanh toán'],
    min: [1, 'Số tiền thanh toán phải lớn hơn 0']
  },
  note: {
    type: String,
    trim: true,
    default: 'Thanh toán công nợ'
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Settlement', settlementSchema);
