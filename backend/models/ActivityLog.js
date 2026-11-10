const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
    index: true
  },
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: [
      'CREATE_EXPENSE',
      'UPDATE_EXPENSE',
      'DELETE_EXPENSE',
      'CREATE_SETTLEMENT',
      'CONFIRM_SETTLEMENT',
      'REJECT_SETTLEMENT',
      'MEMBER_JOIN',
      'MEMBER_LEAVE'
    ],
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
