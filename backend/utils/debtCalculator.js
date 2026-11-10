/**
 * FairShare Core Business Logic: Debt & Balance Calculator
 */

/**
 * 1. Chia tiền linh hoạt (Flexible Split)
 * @param {number} amount - Tổng số tiền
 * @param {string} splitType - 'EQUAL' | 'PERCENTAGE' | 'EXACT'
 * @param {Array} rawSplits - Danh sách chi tiết phân bổ: [{ user, percentage, amountOwed }]
 * @returns {Array} [{ user, amountOwed, percentage }]
 */
function calculateSplits(amount, splitType, rawSplits) {
  if (!amount || amount <= 0) {
    throw new Error('Số tiền phải lớn hơn 0');
  }

  if (!Array.isArray(rawSplits) || rawSplits.length === 0) {
    throw new Error('Danh sách thành viên chia tiền không được để trống');
  }

  const numPeople = rawSplits.length;
  let splits = [];

  switch (splitType) {
    case 'EQUAL': {
      // Chia đều cho N người, xử lý phần dư làm tròn đến đơn vị đồng
      const baseAmount = Math.floor(amount / numPeople);
      let remainder = Math.round(amount - baseAmount * numPeople);

      splits = rawSplits.map((item, index) => {
        const extra = index < remainder ? 1 : 0;
        const amountOwed = baseAmount + extra;
        const percentage = Number(((amountOwed / amount) * 100).toFixed(2));
        return {
          user: item.user._id ? item.user._id : item.user,
          amountOwed,
          percentage
        };
      });
      break;
    }

    case 'PERCENTAGE': {
      // Tổng phần trăm phải xấp xỉ 100%
      const totalPercentage = rawSplits.reduce((acc, curr) => acc + Number(curr.percentage || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new Error(`Tổng phần trăm phải bằng 100% (Hiện tại là ${totalPercentage.toFixed(1)}%)`);
      }

      let currentAllocated = 0;
      splits = rawSplits.map((item, index) => {
        const pct = Number(item.percentage);
        let itemAmount = Math.round((pct / 100) * amount);

        // Điều chỉnh sai số làm tròn cho người cuối cùng
        if (index === numPeople - 1) {
          itemAmount = amount - currentAllocated;
        } else {
          currentAllocated += itemAmount;
        }

        return {
          user: item.user._id ? item.user._id : item.user,
          amountOwed: itemAmount,
          percentage: pct
        };
      });
      break;
    }

    case 'EXACT': {
      // Tổng số tiền cụ thể phải bằng đúng số tiền chi tiêu
      const totalExact = rawSplits.reduce((acc, curr) => acc + Number(curr.amountOwed || 0), 0);
      if (Math.abs(totalExact - amount) > 0.01) {
        throw new Error(`Tổng số tiền các thành viên (${totalExact.toLocaleString('vi-VN')}₫) phải khớp với tổng chi (${amount.toLocaleString('vi-VN')}₫)`);
      }

      splits = rawSplits.map(item => {
        const owed = Number(item.amountOwed);
        const pct = Number(((owed / amount) * 100).toFixed(2));
        return {
          user: item.user._id ? item.user._id : item.user,
          amountOwed: owed,
          percentage: pct
        };
      });
      break;
    }

    default:
      throw new Error(`Kiểu chia tiền '${splitType}' không hợp lệ`);
  }

  return splits;
}

/**
 * 2. Tính số dư gối đầu liên tục (Rolling Net Balance)
 * @param {Array} members - Danh sách thành viên trong nhóm
 * @param {Array} expenses - Lịch sử các khoản chi
 * @param {Array} settlements - Lịch sử các lần quyết toán/trả nợ
 * @returns {Object} { [userId]: netBalance }
 * Dương (>0): Được nhận lại tiền từ nhóm (chủ nợ)
 * Âm (<0): Đang nợ nhóm tiền (người nợ)
 * Bằng 0: Đã cân bằng
 */
function calculateRollingNetBalance(members = [], expenses = [], settlements = []) {
  const netBalances = {};

  // Khởi tạo số dư ban đầu 0 cho tất cả thành viên
  members.forEach(member => {
    const userId = (member.user && member.user._id) ? member.user._id.toString() : (member._id ? member._id.toString() : member.toString());
    netBalances[userId] = 0;
  });

  // 1. Duyệt qua tất cả các khoản chi tiêu (Expenses)
  expenses.forEach(expense => {
    const payerId = (expense.paidBy && expense.paidBy._id) ? expense.paidBy._id.toString() : expense.paidBy.toString();
    const expenseAmount = Number(expense.amount) || 0;

    // Người trả tiền tăng số dư (cộng thêm tổng tiền đã chi)
    netBalances[payerId] = (netBalances[payerId] || 0) + expenseAmount;

    // Những người tham gia chia tiền bị trừ số dư (nợ phần của mình)
    if (Array.isArray(expense.splits)) {
      expense.splits.forEach(split => {
        const splitUserId = (split.user && split.user._id) ? split.user._id.toString() : split.user.toString();
        const owed = Number(split.amountOwed) || 0;
        netBalances[splitUserId] = (netBalances[splitUserId] || 0) - owed;
      });
    }
  });

  // 2. Duyệt qua tất cả các khoản thanh toán/trả nợ (Settlements)
  settlements.forEach(settlement => {
    const payerId = (settlement.payer && settlement.payer._id) ? settlement.payer._id.toString() : settlement.payer.toString();
    const payeeId = (settlement.payee && settlement.payee._id) ? settlement.payee._id.toString() : settlement.payee.toString();
    const settlementAmount = Number(settlement.amount) || 0;

    // Payer trả nợ -> số dư tăng (giảm bớt số âm)
    netBalances[payerId] = (netBalances[payerId] || 0) + settlementAmount;

    // Payee nhận tiền -> số dư giảm (giảm bớt số dương đã đòi được)
    netBalances[payeeId] = (netBalances[payeeId] || 0) - settlementAmount;
  });

  // Làm tròn số dư để tránh số thập phân do phép toán float
  Object.keys(netBalances).forEach(userId => {
    netBalances[userId] = Math.round(netBalances[userId]);
  });

  return netBalances;
}

/**
 * 3. Tối giản hóa giao dịch nợ (Debt Simplification)
 * Khớp người nợ (số dư âm) với chủ nợ (số dư dương) để xuất ra danh sách chuyển khoản tối ưu.
 * @param {Object} netBalances - { [userId]: balance }
 * @param {Object} userMap - Bản đồ chi tiết thông tin user { [userId]: { name, avatar, email } }
 * @returns {Array} [{ from, to, amount, fromUser, toUser }]
 */
function simplifyDebts(netBalances = {}, userMap = {}) {
  const debtors = [];   // Những người cần trả tiền (netBalance < 0)
  const creditors = []; // Những người cần nhận tiền (netBalance > 0)

  Object.entries(netBalances).forEach(([userId, balance]) => {
    if (balance < -1) {
      debtors.push({ user: userId, amount: -balance });
    } else if (balance > 1) {
      creditors.push({ user: userId, amount: balance });
    }
  });

  // Sắp xếp giảm dần theo số tiền để ưu tiên thanh toán khoản lớn trước
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settleAmount = Math.min(debtor.amount, creditor.amount);

    if (settleAmount >= 1) {
      transactions.push({
        from: debtor.user,
        to: creditor.user,
        amount: Math.round(settleAmount),
        fromUser: userMap[debtor.user] || { _id: debtor.user, name: 'Thành viên' },
        toUser: userMap[creditor.user] || { _id: creditor.user, name: 'Thành viên' }
      });
    }

    debtor.amount -= settleAmount;
    creditor.amount -= settleAmount;

    if (debtor.amount < 1) {
      dIdx++;
    }
    if (creditor.amount < 1) {
      cIdx++;
    }
  }

  return transactions;
}

module.exports = {
  calculateSplits,
  calculateRollingNetBalance,
  simplifyDebts
};
