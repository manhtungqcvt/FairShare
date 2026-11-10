const Expense = require('../models/Expense');
const Group = require('../models/Group');
const ActivityLog = require('../models/ActivityLog');
const { calculateSplits } = require('../utils/debtCalculator');

// @desc    Tạo khoản chi tiêu mới
// @route   POST /api/expenses
// @access  Private
exports.createExpense = async (req, res) => {
  try {
    const { group: groupId, title, amount, paidBy, splitType, splits: rawSplits, category, date } = req.body;

    if (!groupId || !title || amount === undefined || amount === null || !paidBy) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: nhóm, tên khoản chi, số tiền và người trả'
      });
    }

    const parsedAmount = Math.round(Number(amount));
    if (parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền chi tiêu phải là số nguyên dương lớn hơn 0'
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

    // Tính toán phân bổ chi tiền theo logic làm tròn tuyệt đối
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
          message: 'Tất cả người tham gia chia tiền phải là thành viên trong nhóm'
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

    // Ghi nhật ký minh bạch ActivityLog
    await ActivityLog.create({
      group: groupId,
      actor: req.user._id,
      action: 'CREATE_EXPENSE',
      description: `${req.user.name} đã thêm khoản chi '${expense.title}' (${expense.amount.toLocaleString('vi-VN')}₫)`,
      metadata: {
        expenseId: expense._id,
        title: expense.title,
        amount: expense.amount,
        splitType: expense.splitType
      }
    });

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

// @desc    Cập nhật khoản chi tiêu (Chỉ createdBy, paidBy hoặc admin mới có quyền)
// @route   PUT /api/expenses/:id
// @access  Private
exports.updateExpense = async (req, res) => {
  try {
    const { title, amount, paidBy, splitType, splits: rawSplits, category, date } = req.body;

    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khoản chi tiêu cần sửa'
      });
    }

    const group = await Group.findById(expense.group);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm tương ứng'
      });
    }

    // Phân quyền sửa: Chỉ createdBy, paidBy hoặc ADMIN của nhóm mới được phép
    const currentUserId = req.user._id.toString();
    const isAdmin = group.members.some(
      m => m.user.toString() === currentUserId && m.role === 'ADMIN'
    );
    const isCreator = expense.createdBy.toString() === currentUserId;
    const isPayer = expense.paidBy.toString() === currentUserId;

    if (!isAdmin && !isCreator && !isPayer) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền sửa khoản chi này (chỉ người tạo, người chi trả hoặc Admin nhóm)'
      });
    }

    const memberIds = group.members.map(m => m.user.toString());
    const targetPaidBy = paidBy || expense.paidBy;

    if (!memberIds.includes(targetPaidBy.toString())) {
      return res.status(400).json({
        success: false,
        message: 'Người thanh toán phải là thành viên nhóm'
      });
    }

    const parsedAmount = amount !== undefined ? Math.round(Number(amount)) : expense.amount;
    if (parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền chi tiêu phải lớn hơn 0'
      });
    }

    const targetSplitType = splitType || expense.splitType;
    const targetSplitsInput = rawSplits || expense.splits;

    let calculatedSplits;
    try {
      calculatedSplits = calculateSplits(parsedAmount, targetSplitType, targetSplitsInput);
    } catch (calcError) {
      return res.status(400).json({
        success: false,
        message: calcError.message
      });
    }

    for (const split of calculatedSplits) {
      if (!memberIds.includes(split.user.toString())) {
        return res.status(400).json({
          success: false,
          message: 'Tất cả người tham gia chia tiền phải là thành viên nhóm'
        });
      }
    }

    // Lưu lại dữ liệu cũ để ghi metadata log
    const oldMetadata = {
      title: expense.title,
      amount: expense.amount,
      splitType: expense.splitType
    };

    if (title) expense.title = title.trim();
    expense.amount = parsedAmount;
    expense.paidBy = targetPaidBy;
    expense.splitType = targetSplitType;
    expense.splits = calculatedSplits;
    if (category) expense.category = category;
    if (date) expense.date = new Date(date);

    await expense.save();

    const populatedExpense = await Expense.findById(expense._id)
      .populate('paidBy', 'name email avatar')
      .populate('splits.user', 'name email avatar')
      .populate('createdBy', 'name email');

    // Ghi nhật ký minh bạch ActivityLog
    await ActivityLog.create({
      group: expense.group,
      actor: req.user._id,
      action: 'UPDATE_EXPENSE',
      description: `${req.user.name} đã cập nhật khoản chi '${expense.title}' (${expense.amount.toLocaleString('vi-VN')}₫)`,
      metadata: {
        expenseId: expense._id,
        old: oldMetadata,
        new: {
          title: expense.title,
          amount: expense.amount,
          splitType: expense.splitType
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật khoản chi thành công',
      expense: populatedExpense
    });
  } catch (error) {
    console.error('Lỗi cập nhật khoản chi:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật khoản chi: ' + error.message
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

// @desc    Xóa khoản chi tiêu (Chỉ createdBy, paidBy hoặc admin mới có quyền)
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
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhóm'
      });
    }

    const currentUserId = req.user._id.toString();
    const isAdmin = group.members.some(
      m => m.user.toString() === currentUserId && m.role === 'ADMIN'
    );
    const isCreator = expense.createdBy.toString() === currentUserId;
    const isPayer = expense.paidBy.toString() === currentUserId;

    if (!isAdmin && !isCreator && !isPayer) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa khoản chi này (chỉ người tạo, người chi trả hoặc Admin nhóm)'
      });
    }

    const deletedTitle = expense.title;
    const deletedAmount = expense.amount;
    const groupId = expense.group;

    await Expense.findByIdAndDelete(req.params.id);

    // Ghi nhật ký minh bạch ActivityLog
    await ActivityLog.create({
      group: groupId,
      actor: req.user._id,
      action: 'DELETE_EXPENSE',
      description: `${req.user.name} đã xóa khoản chi '${deletedTitle}' (${deletedAmount.toLocaleString('vi-VN')}₫)`,
      metadata: {
        title: deletedTitle,
        amount: deletedAmount
      }
    });

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
