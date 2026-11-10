const Expense = require('../models/Expense');
const Group = require('../models/Group');
const { calculateSplits } = require('../utils/debtCalculator');

// @desc    Tạo khoản chi tiêu mới
// @route   POST /api/expenses
// @access  Private
exports.createExpense = async (req, res) => {
  try {
    const { group: groupId, title, amount, paidBy, splitType, splits: rawSplits, category, date } = req.body;

    if (!groupId || !title || !amount || !paidBy) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: nhóm, tên khoản chi, số tiền và người trả'
      });
    }

    // Kiểm tra nhóm và quyền thành viên
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm'
      });
    }

    const memberIds = group.members.map(m => m.user.toString());
    if (!memberIds.includes(req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không phải là thành viên nhóm này'
      });
    }

    if (!memberIds.includes(paidBy.toString())) {
      return res.status(400).json({
        success: false,
        message: 'Người thanh toán phải là thành viên trong nhóm'
      });
    }

    // Tính toán phân bổ chi tiền
    const parsedAmount = Number(amount);
    let calculatedSplits;
    try {
      calculatedSplits = calculateSplits(parsedAmount, splitType || 'EQUAL', rawSplits);
    } catch (calcError) {
      return res.status(400).json({
        success: false,
        message: calcError.message
      });
    }

    // Đảm bảo tất cả người trong split đều là thành viên nhóm
    for (const split of calculatedSplits) {
      if (!memberIds.includes(split.user.toString())) {
        return res.status(400).json({
          success: false,
          message: 'Tất cả người tham gia chia tiền phải là thành viên nhóm'
        });
      }
    }

    const expense = await Expense.create({
      group: groupId,
      title: title.trim(),
      amount: parsedAmount,
      paidBy,
      splitType: splitType || 'EQUAL',
      splits: calculatedSplits,
      category: category || 'Khác',
      date: date ? new Date(date) : new Date(),
      createdBy: req.user._id
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name email avatar')
      .populate('splits.user', 'name email avatar')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Thêm khoản chi tiêu thành công',
      expense: populatedExpense
    });
  } catch (error) {
    console.error('Lỗi thêm khoản chi:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi thêm khoản chi: ' + error.message
    });
  }
};

// @desc    Lấy danh sách các khoản chi của nhóm
// @route   GET /api/expenses/group/:groupId
// @access  Private
exports.getGroupExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;

    const expenses = await Expense.find({ group: groupId })
      .populate('paidBy', 'name email avatar')
      .populate('splits.user', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: expenses.length,
      expenses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách khoản chi: ' + error.message
    });
  }
};

// @desc    Lấy chi tiết 1 khoản chi
// @route   GET /api/expenses/:id
// @access  Private
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('paidBy', 'name email avatar')
      .populate('splits.user', 'name email avatar')
      .populate('createdBy', 'name email');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khoản chi tiêu'
      });
    }

    res.status(200).json({
      success: true,
      expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy chi tiết khoản chi: ' + error.message
    });
  }
};

// @desc    Xóa khoản chi tiêu
// @route   DELETE /api/expenses/:id
// @access  Private
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khoản chi'
      });
    }

    const group = await Group.findById(expense.group);
    const isAdmin = group.members.some(
      m => m.user.toString() === req.user._id.toString() && m.role === 'ADMIN'
    );
    const isCreator = expense.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isCreator) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa khoản chi này'
      });
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Đã xóa khoản chi thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa khoản chi: ' + error.message
    });
  }
};
