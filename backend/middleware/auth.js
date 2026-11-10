const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Group = require('../models/Group');

// Middleware xác thực JWT
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fairshare_jwt_super_secret_key_2026_roommates_safe'
      );

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Tài khoản người dùng không còn tồn tại'
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('Lỗi xác thực JWT:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Bạn chưa đăng nhập hoặc không có quyền truy cập.'
    });
  }
};

// Middleware kiểm tra thành viên của nhóm
const requireGroupMember = async (req, res, next) => {
  try {
    const groupId = req.params.groupId || req.params.id || req.body.group;
    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin mã nhóm (groupId)'
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm / phòng này'
      });
    }

    const isMember = group.members.some(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không phải là thành viên của nhóm này'
      });
    }

    req.group = group;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra quyền thành viên: ' + error.message
    });
  }
};

module.exports = {
  protect,
  requireGroupMember
};
