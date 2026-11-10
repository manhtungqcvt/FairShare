const Settlement = require('../models/Settlement');
const Group = require('../models/Group');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// @desc    Tạo giao dịch thanh toán / quyết toán nợ (2-way Confirmation)
// @route   POST /api/settlements
// @access  Private
exports.createSettlement = async (req, res) => {
  try {
    const { group: groupId, payer, payee, amount, note, date } = req.body;

    if (!groupId || !payer || !payee || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ: nhóm, người trả, người nhận và số tiền'
      });
    }

    if (payer.toString() === payee.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Người trả tiền và người nhận tiền không được trùng nhau'
      });
    }

    const parsedAmount = Math.round(Number(amount));
    if (parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền thanh toán phải là số nguyên dương lớn hơn 0'
      });
    }

    // Kiểm tra nhóm và thành viên
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm'
      });
    }

    const memberIds = group.members.map(m => m.user.toString());
    if (!memberIds.includes(payer.toString()) || !memberIds.includes(payee.toString())) {
      return res.status(400).json({
        success: false,
        message: 'Cả người trả và người nhận tiền đều phải là thành viên trong nhóm'
      });
    }

    const currentUserId = req.user._id.toString();

    // QUY TẮC NGHIỆP VỤ 2 CHIỀU:
    // Nếu người tạo chính là payee (chủ nợ chủ động xác nhận đã nhận tiền) -> CONFIRMED
    // Nếu người tạo là payer (người nợ báo đã chuyển tiền) -> PENDING
    // Trường hợp khác (ví dụ admin): Nếu là payee -> CONFIRMED, ngược lại PENDING
    let initialStatus = 'PENDING';
    if (currentUserId === payee.toString()) {
      initialStatus = 'CONFIRMED';
    }

    const settlement = await Settlement.create({
      group: groupId,
      payer,
      payee,
      amount: parsedAmount,
      note: note ? note.trim() : 'Thanh toán công nợ',
      status: initialStatus,
      createdBy: req.user._id,
      date: date ? new Date(date) : new Date()
    });

    const populatedSettlement = await Settlement.findById(settlement._id)
      .populate('payer', 'name email avatar')
      .populate('payee', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    // Ghi nhật ký hoạt động ActivityLog
    const payerUser = await User.findById(payer).select('name');
    const payeeUser = await User.findById(payee).select('name');
    const statusText = initialStatus === 'CONFIRMED' ? 'Đã xác nhận' : 'Đang chờ xác nhận';

    await ActivityLog.create({
      group: groupId,
      actor: req.user._id,
      action: 'CREATE_SETTLEMENT',
      description: `${req.user.name} đã ghi nhận thanh toán ${parsedAmount.toLocaleString('vi-VN')}₫ từ ${payerUser?.name || 'Thành viên'} đến ${payeeUser?.name || 'Thành viên'} (${statusText})`,
      metadata: {
        settlementId: settlement._id,
        payer,
        payee,
        amount: parsedAmount,
        status: initialStatus
      }
    });

    res.status(201).json({
      success: true,
      message: initialStatus === 'CONFIRMED'
        ? 'Đã xác nhận thanh toán công nợ thành công'
        : 'Yêu cầu thanh toán đã tạo. Đang chờ người nhận xác nhận.',
      settlement: populatedSettlement
    });
  } catch (error) {
    console.error('Lỗi tạo thanh toán:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo thanh toán: ' + error.message
    });
  }
};

// @desc    Xác nhận khoản thanh toán (Chỉ payee mới có quyền)
// @route   PATCH /api/groups/:groupId/settlements/:id/confirm
// @route   PATCH /api/settlements/:id/confirm
// @access  Private
exports.confirmSettlement = async (req, res) => {
  try {
    const settlementId = req.params.id;
    const settlement = await Settlement.findById(settlementId)
      .populate('payer', 'name email avatar')
      .populate('payee', 'name email avatar');

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản ghi thanh toán'
      });
    }

    // Chỉ payee mới có quyền xác nhận
    if (settlement.payee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: `Chỉ người nhận tiền (${settlement.payee.name}) mới có quyền xác nhận khoản thanh toán này`
      });
    }

    if (settlement.status === 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: 'Khoản thanh toán này đã được xác nhận trước đó rồi'
      });
    }

    settlement.status = 'CONFIRMED';
    await settlement.save();

    // Ghi nhật ký hoạt động
    await ActivityLog.create({
      group: settlement.group,
      actor: req.user._id,
      action: 'CONFIRM_SETTLEMENT',
      description: `${req.user.name} đã xác nhận nhận đủ ${settlement.amount.toLocaleString('vi-VN')}₫ từ ${settlement.payer.name}`,
      metadata: {
        settlementId: settlement._id,
        amount: settlement.amount,
        payer: settlement.payer._id,
        payee: settlement.payee._id
      }
    });

    res.status(200).json({
      success: true,
      message: `Đã xác nhận nhận đủ ${settlement.amount.toLocaleString('vi-VN')}₫ từ ${settlement.payer.name}`,
      settlement
    });
  } catch (error) {
    console.error('Lỗi xác nhận thanh toán:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xác nhận thanh toán: ' + error.message
    });
  }
};

// @desc    Từ chối khoản thanh toán (Chỉ payee mới có quyền)
// @route   PATCH /api/groups/:groupId/settlements/:id/reject
// @route   PATCH /api/settlements/:id/reject
// @access  Private
exports.rejectSettlement = async (req, res) => {
  try {
    const settlementId = req.params.id;
    const { reason } = req.body;

    const settlement = await Settlement.findById(settlementId)
      .populate('payer', 'name email avatar')
      .populate('payee', 'name email avatar');

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản ghi thanh toán'
      });
    }

    // Chỉ payee mới có quyền từ chối
    if (settlement.payee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: `Chỉ người nhận tiền (${settlement.payee.name}) mới có quyền từ chối khoản thanh toán này`
      });
    }

    if (settlement.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'Khoản thanh toán này đã bị từ chối trước đó'
      });
    }

    if (settlement.status === 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: 'Không thể từ chối khoản thanh toán đã được xác nhận thành công'
      });
    }

    settlement.status = 'REJECTED';
    if (reason && reason.trim()) {
      settlement.note = (settlement.note || '') + ` [Từ chối: ${reason.trim()}]`;
    }
    await settlement.save();

    // Ghi nhật ký hoạt động
    await ActivityLog.create({
      group: settlement.group,
      actor: req.user._id,
      action: 'REJECT_SETTLEMENT',
      description: `${req.user.name} đã từ chối khoản thanh toán ${settlement.amount.toLocaleString('vi-VN')}₫ từ ${settlement.payer.name}${reason ? ` (Lý do: ${reason.trim()})` : ''}`,
      metadata: {
        settlementId: settlement._id,
        amount: settlement.amount,
        payer: settlement.payer._id,
        payee: settlement.payee._id,
        reason: reason || ''
      }
    });

    res.status(200).json({
      success: true,
      message: 'Đã từ chối khoản thanh toán',
      settlement
    });
  } catch (error) {
    console.error('Lỗi từ chối thanh toán:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi từ chối thanh toán: ' + error.message
    });
  }
};

// @desc    Lấy danh sách các khoản thanh toán nợ của nhóm
// @route   GET /api/settlements/group/:groupId
// @access  Private
exports.getGroupSettlements = async (req, res) => {
  try {
    const groupId = req.params.groupId || req.params.id;

    const settlements = await Settlement.find({ group: groupId })
      .populate('payer', 'name email avatar')
      .populate('payee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: settlements.length,
      settlements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách quyết toán: ' + error.message
    });
  }
};

// @desc    Xóa khoản thanh toán nợ
// @route   DELETE /api/settlements/:id
// @access  Private
exports.deleteSettlement = async (req, res) => {
  try {
    const settlement = await Settlement.findById(req.params.id)
      .populate('payer', 'name email')
      .populate('payee', 'name email');

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản ghi thanh toán'
      });
    }

    const group = await Group.findById(settlement.group);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm'
      });
    }

    const isAdmin = group.members.some(
      m => m.user.toString() === req.user._id.toString() && m.role === 'ADMIN'
    );
    const isParty =
      settlement.payer._id.toString() === req.user._id.toString() ||
      settlement.payee._id.toString() === req.user._id.toString();

    if (!isAdmin && !isParty) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa bản ghi thanh toán này'
      });
    }

    await Settlement.findByIdAndDelete(req.params.id);

    // Ghi nhật ký
    await ActivityLog.create({
      group: settlement.group,
      actor: req.user._id,
      action: 'DELETE_EXPENSE', // Hoặc hành động xóa
      description: `${req.user.name} đã hủy/xóa bản ghi thanh toán ${settlement.amount.toLocaleString('vi-VN')}₫ giữa ${settlement.payer.name} và ${settlement.payee.name}`,
      metadata: {
        settlementId: settlement._id,
        amount: settlement.amount,
        status: settlement.status
      }
    });

    res.status(200).json({
      success: true,
      message: 'Đã xóa bản ghi thanh toán thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa thanh toán: ' + error.message
    });
  }
};
