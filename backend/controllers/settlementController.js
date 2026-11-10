const Settlement = require('../models/Settlement');
const Group = require('../models/Group');

// @desc    Tạo giao dịch thanh toán / quyết toán nợ
// @route   POST /api/settlements
// @access  Private
exports.createSettlement = async (req, res) => {
  try {
    const { group: groupId, payer, payee, amount, note, date } = req.body;

    if (!groupId || !payer || !payee || !amount) {
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

    const parsedAmount = Number(amount);
    if (parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền thanh toán phải lớn hơn 0'
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
        message: 'Cả người trả và người nhận tiền đều phải là thành viên nhóm'
      });
    }

    const settlement = await Settlement.create({
      group: groupId,
      payer,
      payee,
      amount: parsedAmount,
      note: note ? note.trim() : 'Thanh toán công nợ',
      date: date ? new Date(date) : new Date()
    });

    const populatedSettlement = await Settlement.findById(settlement._id)
      .populate('payer', 'name email avatar')
      .populate('payee', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Ghi nhận thanh toán công nợ thành công',
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

// @desc    Lấy danh sách các khoản thanh toán nợ của nhóm
// @route   GET /api/settlements/group/:groupId
// @access  Private
exports.getGroupSettlements = async (req, res) => {
  try {
    const { groupId } = req.params;

    const settlements = await Settlement.find({ group: groupId })
      .populate('payer', 'name email avatar')
      .populate('payee', 'name email avatar')
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
    const settlement = await Settlement.findById(req.params.id);
    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản ghi thanh toán'
      });
    }

    const group = await Group.findById(settlement.group);
    const isAdmin = group.members.some(
      m => m.user.toString() === req.user._id.toString() && m.role === 'ADMIN'
    );
    const isParty =
      settlement.payer.toString() === req.user._id.toString() ||
      settlement.payee.toString() === req.user._id.toString();

    if (!isAdmin && !isParty) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa bản ghi thanh toán này'
      });
    }

    await Settlement.findByIdAndDelete(req.params.id);

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
