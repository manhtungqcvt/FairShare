const mongoose = require('mongoose');

const splitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amountOwed: {
    type: Number,
    required: true,
    min: 0
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  }
}, { _id: false });

const expenseSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tên khoản chi'],
    trim: true,
    maxlength: [120, 'Tên khoản chi không được quá 120 ký tự']
  },
  amount: {
    type: Number,
    required: [true, 'Vui lòng nhập số tiền'],
    min: [1, 'Số tiền phải lớn hơn 0']
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Vui lòng chọn người thanh toán']
  },
  splitType: {
    type: String,
    enum: ['EQUAL', 'PERCENTAGE', 'EXACT'],
    required: true,
    default: 'EQUAL'
  },
  splits: {
    type: [splitSchema],
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'Khoản chi phải có ít nhất 1 người tham gia chia tiền'
    }
  },
  category: {
    type: String,
    enum: ['Tiền nhà', 'Điện nước', 'Ăn uống', 'Đồ gia dụng', 'Khác'],
    default: 'Khác'
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Expense', expenseSchema);
