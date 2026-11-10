const Group = require('../models/Group');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const {
  calculateRollingNetBalance,
  simplifyDebts
} = require('../utils/debtCalculator');

// @desc    Tạo nhóm / phòng mới
// @route   POST /api/groups
// @access  Private
exports.createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên phòng / nhóm'
      });
    }

    // Tạo mã mời duy nhất
    let inviteCode = Group.generateInviteCode();
    let codeExists = await Group.findOne({ inviteCode });
    let attempts = 0;
    while (codeExists && attempts < 10) {
      inviteCode = Group.generateInviteCode();
      codeExists = await Group.findOne({ inviteCode });
      attempts++;
    }

    const group = await Group.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      inviteCode,
      createdBy: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'ADMIN',
          joinedAt: new Date()
        }
      ]
    });

    // Ghi nhật ký tạo phòng
    await ActivityLog.create({
      group: group._id,
      actor: req.user._id,
      action: 'MEMBER_JOIN',
      description: `${req.user.name} đã khởi tạo nhóm "${group.name}"`,
      metadata: { inviteCode }
    });

    const populatedGroup = await Group.findById(group._id).populate('members.user', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Tạo nhóm thành công',
      group: populatedGroup
    });
  } catch (error) {
    console.error('Lỗi tạo nhóm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo nhóm: ' + error.message
    });
  }
};

// @desc    Lấy danh sách các nhóm người dùng đã tham gia
// @route   GET /api/groups
// @access  Private
exports.getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      'members.user': req.user._id
    })
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Tính toán số dư cá nhân và tổng chi tiêu cho từng nhóm
    const groupsWithStats = await Promise.all(
      groups.map(async (group) => {
        const expenses = await Expense.find({ group: group._id });
        const settlements = await Settlement.find({ group: group._id });

        const balances = calculateRollingNetBalance(group.members, expenses, settlements);
        const myBalance = balances[req.user._id.toString()] || 0;
        const totalSpent = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

        return {
          ...group.toObject(),
          totalSpent,
          myBalance,
          expenseCount: expenses.length
        };
      })
    );

    res.status(200).json({
      success: true,
      count: groupsWithStats.length,
      groups: groupsWithStats
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách nhóm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách nhóm: ' + error.message
    });
  }
};

// @desc    Lấy chi tiết một nhóm theo ID
// @route   GET /api/groups/:id
// @access  Private
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm'
      });
    }

    // Kiểm tra xem người dùng có trong nhóm không
    const isMember = group.members.some(
      m => m.user && m.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập thông tin nhóm này'
      });
    }

    res.status(200).json({
      success: true,
      group
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy chi tiết nhóm: ' + error.message
    });
  }
};

// @desc    Tham gia nhóm bằng mã mời (inviteCode)
// @route   POST /api/groups/join
// @access  Private
exports.joinGroupByCode = async (req, res) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode || !inviteCode.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mã mời (6 ký tự)'
      });
    }

    const cleanCode = inviteCode.trim().toUpperCase();
    const group = await Group.findOne({ inviteCode: cleanCode });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Mã mời không tồn tại hoặc đã hết hạn'
      });
    }

    // Kiểm tra đã là thành viên chưa
    const alreadyMember = group.members.some(
      m => m.user.toString() === req.user._id.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã là thành viên của nhóm này rồi'
      });
    }

    // Thêm vào nhóm
    group.members.push({
      user: req.user._id,
      role: 'MEMBER',
      joinedAt: new Date()
    });

    await group.save();

    // Ghi nhật ký hoạt động
    await ActivityLog.create({
      group: group._id,
      actor: req.user._id,
      action: 'MEMBER_JOIN',
      description: `${req.user.name} đã tham gia vào phòng qua mã mời`,
      metadata: { userId: req.user._id }
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: `Đã tham gia phòng "${group.name}" thành công!`,
      group: populatedGroup
    });
  } catch (error) {
    console.error('Lỗi tham gia nhóm:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tham gia nhóm: ' + error.message
    });
  }
};

// @desc    Rời phòng hoặc Admin xóa thành viên (Member Exit Lock)
// @route   DELETE /api/groups/:id/members/:userId
// @access  Private
exports.removeMember = async (req, res) => {
  try {
    const groupId = req.params.id || req.params.groupId;
    const { userId } = req.params;

    const group = await Group.findById(groupId).populate('members.user', 'name email avatar');
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm'
      });
    }

    const targetMember = group.members.find(
      m => m.user && m.user._id.toString() === userId.toString()
    );

    if (!targetMember) {
      return res.status(404).json({
        success: false,
        message: 'Thành viên không tồn tại trong nhóm này'
      });
    }

    // Quyền kiểm tra: Chỉ chính thành viên đó (tự rời) HOẶC Admin nhóm mới được thao tác
    const currentUserId = req.user._id.toString();
    const isAdmin = group.members.some(
      m => m.user && m.user._id.toString() === currentUserId && m.role === 'ADMIN'
    );
    const isSelf = currentUserId === userId.toString();

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa thành viên này khỏi nhóm'
      });
    }

    // RÀNG BUỘC RỜI PHÒNG (Member Exit Lock):
    // Hệ thống chạy hàm tính netBalance của thành viên đó trong nhóm
    const expenses = await Expense.find({ group: groupId });
    const settlements = await Settlement.find({ group: groupId });
    const netBalances = calculateRollingNetBalance(group.members, expenses, settlements);

    const memberBalance = netBalances[userId.toString()] || 0;

    if (Math.abs(memberBalance) > 0) {
      const balanceFormatted = `${memberBalance > 0 ? '+' : ''}${memberBalance.toLocaleString('vi-VN')}₫`;
      return res.status(400).json({
        success: false,
        message: `Thành viên này vẫn còn công nợ chưa tất toán (Số dư: ${balanceFormatted}). Vui lòng thanh toán hết trước khi rời phòng.`
      });
    }

    // Nếu netBalance === 0, cho phép rời phòng / xóa thành viên
    group.members = group.members.filter(
      m => m.user && m.user._id.toString() !== userId.toString()
    );

    // Nếu người rời là admin và nhóm vẫn còn thành viên nhưng không còn admin nào, phong admin cho thành viên đầu tiên
    const hasAdminLeft = group.members.some(m => m.role === 'ADMIN');
    if (!hasAdminLeft && group.members.length > 0) {
      group.members[0].role = 'ADMIN';
    }

    await group.save();

    // Ghi nhật ký hoạt động
    const targetUserName = targetMember.user?.name || 'Thành viên';
    const actionDesc = isSelf
      ? `${targetUserName} đã rời khỏi nhóm`
      : `${req.user.name} đã xóa ${targetUserName} khỏi nhóm`;

    await ActivityLog.create({
      group: groupId,
      actor: req.user._id,
      action: 'MEMBER_LEAVE',
      description: actionDesc,
      metadata: {
        userId,
        userName: targetUserName,
        removedBy: req.user._id,
        isSelf
      }
    });

    res.status(200).json({
      success: true,
      message: isSelf ? 'Bạn đã rời nhóm thành công' : `Đã xóa ${targetUserName} khỏi nhóm thành công`,
      members: group.members
    });
  } catch (error) {
    console.error('Lỗi xóa thành viên:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xử lý rời phòng: ' + error.message
    });
  }
};

// @desc    Lấy bảng đối soát số dư & công nợ tối giản của nhóm
// @route   GET /api/groups/:id/balances
// @access  Private
exports.getGroupBalances = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('members.user', 'name email avatar');
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm'
      });
    }

    const expenses = await Expense.find({ group: group._id })
      .populate('paidBy', 'name email avatar')
      .populate('splits.user', 'name email avatar');

    const settlements = await Settlement.find({ group: group._id })
      .populate('payer', 'name email avatar')
      .populate('payee', 'name email avatar');

    // Tạo bản đồ user map
    const userMap = {};
    group.members.forEach(m => {
      if (m.user) {
        userMap[m.user._id.toString()] = {
          _id: m.user._id,
          name: m.user.name,
          email: m.user.email,
          avatar: m.user.avatar,
          role: m.role
        };
      }
    });

    // Tính toán số dư ròng gối đầu (chỉ tính Settlement CONFIRMED)
    const netBalances = calculateRollingNetBalance(group.members, expenses, settlements);

    // Tối giản hóa các giao dịch nợ
    const simplifiedDebts = simplifyDebts(netBalances, userMap);

    // Tính tổng chi tiêu của nhóm
    const totalGroupExpense = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // Thống kê thành viên kèm số dư
    const memberBalances = group.members.map(m => {
      const uId = m.user ? m.user._id.toString() : '';
      return {
        user: m.user,
        role: m.role,
        balance: netBalances[uId] || 0
      };
    });

    const myBalance = netBalances[req.user._id.toString()] || 0;

    res.status(200).json({
      success: true,
      data: {
        totalGroupExpense,
        myBalance,
        netBalances,
        memberBalances,
        simplifiedDebts,
        stats: {
          totalExpenses: expenses.length,
          totalSettlements: settlements.filter(s => s.status === 'CONFIRMED').length,
          pendingSettlements: settlements.filter(s => s.status === 'PENDING').length
        }
      }
    });
  } catch (error) {
    console.error('Lỗi tính toán số dư:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tính toán số dư: ' + error.message
    });
  }
};

// @desc    Lấy dòng thời gian sao kê tổng hợp (Lịch sử chi tiêu + Trả nợ)
// @route   GET /api/groups/:id/history
// @access  Private
exports.getGroupHistory = async (req, res) => {
  try {
    const groupId = req.params.id;

    const [expenses, settlements] = await Promise.all([
      Expense.find({ group: groupId })
        .populate('paidBy', 'name email avatar')
        .populate('splits.user', 'name email avatar')
        .populate('createdBy', 'name email')
        .lean(),
      Settlement.find({ group: groupId })
        .populate('payer', 'name email avatar')
        .populate('payee', 'name email avatar')
        .populate('createdBy', 'name email avatar')
        .lean()
    ]);

    // Gắn nhãn type để đồng nhất timeline
    const expenseItems = expenses.map(e => ({
      ...e,
      itemType: 'EXPENSE'
    }));

    const settlementItems = settlements.map(s => ({
      ...s,
      itemType: 'SETTLEMENT',
      title: s.note || 'Thanh toán công nợ'
    }));

    // Gộp và sắp xếp theo ngày giảm dần
    const history = [...expenseItems, ...settlementItems].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt);
      const dateB = new Date(b.date || b.createdAt);
      return dateB - dateA;
    });

    res.status(200).json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy lịch sử sao kê: ' + error.message
    });
  }
};

// @desc    Lấy nhật ký minh bạch ActivityLog của nhóm
// @route   GET /api/groups/:id/activities
// @access  Private
exports.getGroupActivities = async (req, res) => {
  try {
    const groupId = req.params.id;

    const activities = await ActivityLog.find({ group: groupId })
      .populate('actor', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: activities.length,
      activities
    });
  } catch (error) {
    console.error('Lỗi lấy nhật ký hoạt động:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy nhật ký hoạt động: ' + error.message
    });
  }
};
