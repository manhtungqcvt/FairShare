import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { formatVND } from '../../utils/format';
import Button from '../common/Button';
import Input from '../common/Input';
import {
  X,
  Receipt,
  DollarSign,
  Calendar,
  User,
  Users,
  Percent,
  Calculator,
  Check,
  AlertCircle
} from 'lucide-react';

const CATEGORIES = ['Ăn uống', 'Điện nước', 'Tiền nhà', 'Đồ gia dụng', 'Khác'];

export default function AddExpenseModal({
  isOpen,
  onClose,
  group,
  currentUser,
  onExpenseCreated
}) {
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Ăn uống');
  const [paidBy, setPaidBy] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [splitType, setSplitType] = useState('EQUAL'); // 'EQUAL' | 'PERCENTAGE' | 'EXACT'

  // State cho từng chế độ chia
  // EQUAL: set các userId được chọn
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  // PERCENTAGE: { [userId]: number }
  const [percentages, setPercentages] = useState({});
  // EXACT: { [userId]: number }
  const [exactAmounts, setExactAmounts] = useState({});

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Khởi tạo giá trị ban đầu khi modal mở hoặc group thay đổi
  useEffect(() => {
    if (group?.members && group.members.length > 0) {
      const allIds = group.members.map((m) => m.user._id);
      setSelectedUserIds(allIds);

      // Mặc định người trả là currentUser hoặc người đầu tiên
      setPaidBy(currentUser?._id || group.members[0].user._id);

      // Mặc định chia đều phần trăm
      const initialPct = {};
      const basePct = Math.floor(100 / allIds.length);
      const remPct = 100 - basePct * allIds.length;
      allIds.forEach((id, idx) => {
        initialPct[id] = basePct + (idx < remPct ? 1 : 0);
      });
      setPercentages(initialPct);

      // Mặc định exact
      setExactAmounts({});
    }
  }, [group, currentUser, isOpen]);

  if (!isOpen || !group) return null;

  const parsedAmount = Number(amount) || 0;

  // Xử lý chuyển đổi chọn người trong EQUAL
  const toggleUserEqual = (userId) => {
    if (selectedUserIds.includes(userId)) {
      if (selectedUserIds.length === 1) {
        setErrorMsg('Phải có ít nhất 1 người tham gia chia tiền');
        return;
      }
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
    setErrorMsg('');
  };

  // Tính toán Preview phân bổ trực tiếp
  const calculateLivePreview = () => {
    if (parsedAmount <= 0) return [];

    if (splitType === 'EQUAL') {
      const count = selectedUserIds.length;
      if (count === 0) return [];
      const base = Math.floor(parsedAmount / count);
      const rem = parsedAmount - base * count;

      return group.members.map((m) => {
        const uId = m.user._id;
        const isSelected = selectedUserIds.includes(uId);
        if (!isSelected) {
          return { user: m.user, amountOwed: 0, percentage: 0, isIncluded: false };
        }
        const idx = selectedUserIds.indexOf(uId);
        const owed = base + (idx < rem ? 1 : 0);
        const pct = ((owed / parsedAmount) * 100).toFixed(1);
        return { user: m.user, amountOwed: owed, percentage: pct, isIncluded: true };
      });
    }

    if (splitType === 'PERCENTAGE') {
      let allocated = 0;
      const validMembers = group.members.filter((m) => percentages[m.user._id] > 0);

      return group.members.map((m, idx) => {
        const pct = Number(percentages[m.user._id]) || 0;
        let owed = Math.round((pct / 100) * parsedAmount);
        if (idx === group.members.length - 1 && validMembers.length > 0) {
          owed = parsedAmount - allocated;
        } else {
          allocated += owed;
        }
        return { user: m.user, amountOwed: owed, percentage: pct, isIncluded: pct > 0 };
      });
    }

    if (splitType === 'EXACT') {
      return group.members.map((m) => {
        const owed = Number(exactAmounts[m.user._id]) || 0;
        const pct = parsedAmount > 0 ? ((owed / parsedAmount) * 100).toFixed(1) : 0;
        return { user: m.user, amountOwed: owed, percentage: pct, isIncluded: owed > 0 };
      });
    }

    return [];
  };

  const liveSplits = calculateLivePreview();

  // Kiểm tra tổng phần trăm
  const totalPercentage = Object.values(percentages).reduce(
    (sum, val) => sum + (Number(val) || 0),
    0
  );

  // Kiểm tra tổng tiền exact
  const totalExact = Object.values(exactAmounts).reduce(
    (sum, val) => sum + (Number(val) || 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tên khoản chi');
      return;
    }

    if (parsedAmount <= 0) {
      setErrorMsg('Số tiền chi tiêu phải lớn hơn 0');
      return;
    }

    // Chuẩn bị payload splits theo splitType
    let payloadSplits = [];

    if (splitType === 'EQUAL') {
      if (selectedUserIds.length === 0) {
        setErrorMsg('Vui lòng chọn ít nhất 1 người tham gia chia tiền');
        return;
      }
      payloadSplits = selectedUserIds.map((userId) => ({ user: userId }));
    } else if (splitType === 'PERCENTAGE') {
      if (Math.abs(totalPercentage - 100) > 0.01) {
        setErrorMsg(`Tổng phần trăm phải bằng 100% (Hiện tại là ${totalPercentage.toFixed(1)}%)`);
        return;
      }
      payloadSplits = group.members.map((m) => ({
        user: m.user._id,
        percentage: Number(percentages[m.user._id]) || 0
      }));
    } else if (splitType === 'EXACT') {
      if (Math.abs(totalExact - parsedAmount) > 0.01) {
        setErrorMsg(
          `Tổng số tiền chia (${formatVND(totalExact)}) chưa bằng tổng số tiền chi (${formatVND(
            parsedAmount
          )}). Còn lệch ${formatVND(Math.abs(parsedAmount - totalExact))}`
        );
        return;
      }
      payloadSplits = group.members.map((m) => ({
        user: m.user._id,
        amountOwed: Number(exactAmounts[m.user._id]) || 0
      }));
    }

    setLoading(true);
    try {
      const res = await api.post('/expenses', {
        group: group._id,
        title: title.trim(),
        amount: parsedAmount,
        paidBy,
        splitType,
        splits: payloadSplits,
        category,
        date
      });

      if (res.data.success) {
        showToast(`Đã thêm khoản chi "${title}" thành công!`, 'success');
        onClose();
        if (onExpenseCreated) onExpenseCreated(res.data.expense);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi tạo khoản chi';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div
        className="glass-modal w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Thêm khoản chi tiêu mới</h3>
            <p className="text-xs text-slate-500">
              Phòng: <strong className="text-slate-700">{group.name}</strong> • Tự động tính số dư gối đầu
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: Tên khoản chi & Số tiền */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tên khoản chi"
              id="title"
              placeholder="VD: Tiền điện nước, Bữa tối Lotte..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              icon={Receipt}
              required
              autoFocus
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Số tiền (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-xl shadow-sm">
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  placeholder="500000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-3.5 pr-14 text-sm font-semibold num-vnd bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-bold text-slate-400 pointer-events-none">
                  VNĐ
                </span>
              </div>
              {parsedAmount > 0 && (
                <p className="text-[11px] font-semibold text-emerald-600 mt-1 num-vnd">
                  {formatVND(parsedAmount)}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Danh mục (Pill selector) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Danh mục chi tiêu
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    category === cat
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300 ring-offset-1'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Người thanh toán & Ngày */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Người trả tiền trước <span className="text-rose-500">*</span>
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all cursor-pointer font-medium"
              >
                {group.members?.map((m) => (
                  <option key={m.user._id} value={m.user._id}>
                    {m.user.name} {m.user._id === currentUser?._id ? '(Bạn)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Ngày chi tiêu
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* Row 4: CHẾ ĐỘ CHIA TIỀN (Split Mode Tabs) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-emerald-600" />
                <span>Phương thức chia tiền</span>
              </label>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setSplitType('EQUAL')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    splitType === 'EQUAL'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Chia đều (=)
                </button>
                <button
                  type="button"
                  onClick={() => setSplitType('PERCENTAGE')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    splitType === 'PERCENTAGE'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Theo % (%)
                </button>
                <button
                  type="button"
                  onClick={() => setSplitType('EXACT')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    splitType === 'EXACT'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Số tiền lẻ (₫)
                </button>
              </div>
            </div>

            {/* Split Content: EQUAL */}
            {splitType === 'EQUAL' && (
              <div className="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                <p className="text-xs text-slate-500 mb-2">
                  Tích chọn những người tham gia chia khoản này. Số tiền sẽ được tự động chia đều.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.members?.map((m) => {
                    const isSelected = selectedUserIds.includes(m.user._id);
                    const previewItem = liveSplits.find((s) => s.user._id === m.user._id);
                    return (
                      <div
                        key={m.user._id}
                        onClick={() => toggleUserEqual(m.user._id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                              isSelected
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <img
                            src={m.user.avatar}
                            alt=""
                            className="w-6 h-6 rounded-full bg-slate-100"
                          />
                          <span className="text-xs font-semibold truncate max-w-[120px]">
                            {m.user.name}
                          </span>
                        </div>
                        {isSelected && parsedAmount > 0 && (
                          <span className="text-xs font-bold text-emerald-700 num-vnd">
                            {formatVND(previewItem?.amountOwed || 0)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Split Content: PERCENTAGE */}
            {splitType === 'PERCENTAGE' && (
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Nhập tỷ lệ % cho từng thành viên:</span>
                  <span
                    className={`font-bold ${
                      Math.abs(totalPercentage - 100) < 0.01
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    Tổng: {totalPercentage.toFixed(1)}% / 100%
                  </span>
                </div>
                <div className="space-y-2">
                  {group.members?.map((m) => {
                    const pctVal = percentages[m.user._id] ?? '';
                    const previewItem = liveSplits.find((s) => s.user._id === m.user._id);
                    return (
                      <div
                        key={m.user._id}
                        className="flex items-center justify-between gap-3 p-2 bg-white rounded-xl border border-slate-200"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <img
                            src={m.user.avatar}
                            alt=""
                            className="w-6 h-6 rounded-full bg-slate-100"
                          />
                          <span className="text-xs font-semibold text-slate-800 truncate">
                            {m.user.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {parsedAmount > 0 && (
                            <span className="text-xs font-bold text-slate-600 num-vnd">
                              {formatVND(previewItem?.amountOwed || 0)}
                            </span>
                          )}
                          <div className="relative w-20">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={pctVal}
                              onChange={(e) =>
                                setPercentages({
                                  ...percentages,
                                  [m.user._id]: Number(e.target.value)
                                })
                              }
                              className="w-full text-right text-xs font-bold py-1.5 pl-2 pr-6 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Split Content: EXACT */}
            {splitType === 'EXACT' && (
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Nhập số tiền chính xác từng người chịu:</span>
                  <span
                    className={`font-bold num-vnd ${
                      Math.abs(totalExact - parsedAmount) < 0.01
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    Đã phân bổ: {formatVND(totalExact)} / {formatVND(parsedAmount)}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.members?.map((m) => {
                    const exactVal = exactAmounts[m.user._id] ?? '';
                    return (
                      <div
                        key={m.user._id}
                        className="flex items-center justify-between gap-3 p-2 bg-white rounded-xl border border-slate-200"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <img
                            src={m.user.avatar}
                            alt=""
                            className="w-6 h-6 rounded-full bg-slate-100"
                          />
                          <span className="text-xs font-semibold text-slate-800 truncate">
                            {m.user.name}
                          </span>
                        </div>
                        <div className="relative w-36">
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={exactVal}
                            onChange={(e) =>
                              setExactAmounts({
                                ...exactAmounts,
                                [m.user._id]: Number(e.target.value)
                              })
                            }
                            className="w-full text-right text-xs font-bold py-1.5 pl-2 pr-8 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 num-vnd"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                            ₫
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              Thêm khoản chi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
