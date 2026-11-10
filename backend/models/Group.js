const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['ADMIN', 'MEMBER'],
    default: 'MEMBER'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên phòng / nhóm'],
    trim: true,
    maxlength: [100, 'Tên nhóm không quá 100 ký tự']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  inviteCode: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
    trim: true,
    index: true
  },
  members: [memberSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hàm tạo mã mời 6 ký tự ngẫu nhiên
groupSchema.statics.generateInviteCode = function() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Tránh O, 0, I, 1 gây nhầm lẫn
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

module.exports = mongoose.model('Group', groupSchema);
