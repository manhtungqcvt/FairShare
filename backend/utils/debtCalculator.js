/**
 * FairShare Core Business Logic: Debt & Balance Calculator
 * Strict VND Integer Accounting & Settlement Verification
 */

/**
 * 1. Chia tiền linh hoạt & làm tròn số nguyên tuyệt đối (Strict Currency Splitting)
 * @param {number} amount - Tổng số tiền (số nguyên dương VNĐ)
 * @param {string} splitType - 'EQUAL' | 'PERCENTAGE' | 'EXACT'
 * @param {Array} rawSplits - Danh sách chi tiết phân bổ: [{ user, percentage, amountOwed }]
 * @returns {Array} [{ user, amountOwed, percentage }]
 */
function calculateSplits(amount, splitType, rawSplits) {
  const integerAmount = Math.round(Number(amount));
  if (!integerAmount || integerAmount <= 0) {
    throw new Error('Số tiền phải là số nguyên dương lớn hơn 0');
  }

  if (!Array.isArray(rawSplits) || rawSplits.length === 0) {
    throw new Error('Danh sách thành viên chia tiền phải có ít nhất 1 người');
  }

  // Kiểm tra không được trùng lặp userId
  const seenUsers = new Set();
  for (const item of rawSplits) {
    const userIdStr = (item.user && item.user._id)
      ? item.user._id.toString()
      : (item.user ? item.user.toString() : '');

    if (!userIdStr) {
      throw new Error('Thông tin người tham gia chia tiền không hợp lệ');
    }

    if (seenUsers.has(userIdStr)) {
      throw new Error('Danh sách chia tiền không được trùng lặp thành viên');
    }
    seenUsers.add(userIdStr);
  }

  const numPeople = rawSplits.length;
  let splits = [];

  switch (splitType) {
    case 'EQUAL': {
      // Khi chia đều cho N thành viên: sử dụng Math.floor() cho từng người
      const baseFloor = Math.floor(integerAmount / numPeople);
      splits = rawSplits.map(item => ({
        user: item.user._id ? item.user._id : item.user,
        amountOwed: baseFloor,
        percentage: Number(((baseFloor / integerAmount) * 100).toFixed(2))
      }));

      // Tính phần dư: remainder = amount - sum(amountOwed)
      const currentSum = baseFloor * numPeople;
      const remainder = integerAmount - currentSum;

      // Nếu remainder !== 0, cộng phần dư đó vào người đầu tiên trong mảng splits
      if (remainder !== 0 && splits.length > 0) {
        splits[0].amountOwed += remainder;
        splits[0].percentage = Number(((splits[0].amountOwed / integerAmount) * 100).toFixed(2));
      }
      break;
    }

    case 'PERCENTAGE': {
      // Với PERCENTAGE: Tổng percentage phải bằng đúng 100
      const totalPercentage = rawSplits.reduce((acc, curr) => acc + Number(curr.percentage || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.001) {
        throw new Error(`Tổng phần trăm phải bằng đúng 100% (Hiện tại là ${Number(totalPercentage.toFixed(2))}%)`);
      }

      // Mỗi người dùng Math.floor()
      let allocatedSum = 0;
      splits = rawSplits.map(item => {
        const pct = Number(item.percentage || 0);
        const itemAmount = Math.floor((pct / 100) * integerAmount);
        allocatedSum += itemAmount;
        return {
          user: item.user._id ? item.user._id : item.user,
          amountOwed: itemAmount,
          percentage: pct
        };
      });

      // remainder = amount - sum(amountOwed)
      const remainder = integerAmount - allocatedSum;
      // Nếu remainder !== 0, cộng phần remainder đó vào người đầu tiên trong mảng splits
      if (remainder !== 0 && splits.length > 0) {
        splits[0].amountOwed += remainder;
      }
      break;
    }

    case 'EXACT': {
      // Với EXACT: Tổng amountOwed truyền lên phải bằng đúng amount
      const totalExact = rawSplits.reduce((acc, curr) => acc + Math.round(Number(curr.amountOwed || 0)), 0);
      if (totalExact !== integerAmount) {
        throw new Error(`Tổng số tiền các thành viên (${totalExact.toLocaleString('vi-VN')}₫) phải bằng đúng tổng chi (${integerAmount.toLocaleString('vi-VN')}₫)`);
      }

      splits = rawSplits.map(item => {
        const owed = Math.round(Number(item.amountOwed));
        if (owed < 0) {
          throw new Error('Số tiền chia cho từng người không được là số âm');
        }
        const pct = Number(((owed / integerAmount) * 100).toFixed(2));
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

  // Đảm bảo tổng splits.amountOwed === expense.amount tuyệt đối 100%
  const totalVerified = splits.reduce((acc, curr) => acc + curr.amountOwed, 0);
  if (totalVerified !== integerAmount) {
    throw new Error(`Lỗi khớp số liệu: Tổng các phần chia (${totalVerified}) không bằng tổng tiền (${integerAmount})`);
  }

  return splits;
}

/**
 * 2. Tính số dư gối đầu liên tục (Rolling Net Balance)
 * QUAN TRỌNG: Chỉ tính các khoản Settlement có status === 'CONFIRMED'
 * @param {Array} members - Danh sách thành viên trong nhóm
 * @param {Array} expenses - Lịch sử các khoản chi
 * @param {Array} settlements - Lịch sử các lần quyết toán/trả nợ
 * @returns {Object} { [userId]: netBalance }
 */
function calculateRollingNetBalance(members = [], expenses = [], settlements = []) {
  const netBalances = {};

  // Khởi tạo số dư ban đầu 0 cho tất cả thành viên
  members.forEach(member => {
    const userId = (member.user && member.user._id)
      ? member.user._id.toString()
      : (member._id ? member._id.toString() : member.toString());
    if (userId) {
      netBalances[userId] = 0;
    }
  });

  // 1. Duyệt qua tất cả các khoản chi tiêu (Expenses)
  expenses.forEach(expense => {
    const payerId = (expense.paidBy && expense.paidBy._id)
      ? expense.paidBy._id.toString()
      : expense.paidBy.toString();
    const expenseAmount = Math.round(Number(expense.amount) || 0);

    // Người trả tiền tăng số dư (cộng thêm tổng tiền đã chi)
    netBalances[payerId] = (netBalances[payerId] || 0) + expenseAmount;

    // Những người tham gia chia tiền bị trừ số dư (nợ phần của mình)
    if (Array.isArray(expense.splits)) {
      expense.splits.forEach(split => {
        const splitUserId = (split.user && split.user._id)
          ? split.user._id.toString()
          : split.user.toString();
        const owed = Math.round(Number(split.amountOwed) || 0);
        netBalances[splitUserId] = (netBalances[splitUserId] || 0) - owed;
      });
    }
  });

  // 2. Duyệt qua tất cả các khoản thanh toán/trả nợ (Settlements)
  // Chỉ tính các khoản Settlement có status === 'CONFIRMED'
  settlements.forEach(settlement => {
    if (settlement.status !== 'CONFIRMED') {
      return; // Bỏ qua nếu PENDING hoặc REJECTED
    }

    const payerId = (settlement.payer && settlement.payer._id)
      ? settlement.payer._id.toString()
      : settlement.payer.toString();
    const payeeId = (settlement.payee && settlement.payee._id)
      ? settlement.payee._id.toString()
      : settlement.payee.toString();
    const settlementAmount = Math.round(Number(settlement.amount) || 0);

    // Payer trả nợ -> số dư tăng (giảm bớt số âm)
    netBalances[payerId] = (netBalances[payerId] || 0) + settlementAmount;

    // Payee nhận tiền -> số dư giảm (giảm bớt số dương đã đòi được)
    netBalances[payeeId] = (netBalances[payeeId] || 0) - settlementAmount;
  });

  // Làm tròn số nguyên VNĐ tuyệt đối
  Object.keys(netBalances).forEach(userId => {
    netBalances[userId] = Math.round(netBalances[userId]);
  });

  return netBalances;
}

/**
 * 3. Tối giản hóa giao dịch nợ (Debt Simplification)
 * @param {Object} netBalances - { [userId]: balance }
 * @param {Object} userMap - Bản đồ chi tiết thông tin user
 * @returns {Array} [{ from, to, amount, fromUser, toUser }]
 */
function simplifyDebts(netBalances = {}, userMap = {}) {
  const debtors = [];   // Những người cần trả tiền (netBalance < 0)
  const creditors = []; // Những người cần nhận tiền (netBalance > 0)

  Object.entries(netBalances).forEach(([userId, balance]) => {
    const intBal = Math.round(balance);
    if (intBal < 0) {
      debtors.push({ user: userId, amount: -intBal });
    } else if (intBal > 0) {
      creditors.push({ user: userId, amount: intBal });
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
