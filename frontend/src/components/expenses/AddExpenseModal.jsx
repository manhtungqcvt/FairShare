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
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles
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
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [percentages, setPercentages] = useState({});
  const [exactAmounts, setExactAmounts] = useState({});

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Khởi tạo giá trị ban đầu khi modal mở hoặc group thay đổi
  useEffect(() => {
    if (group?.members && group.members.length > 0) {
      const allIds = group.members.map((m) => m.user._id);
      setSelectedUserIds(allIds);

      setPaidBy(currentUser?._id || group.members[0].user._id);

      // Chia đều % ban đầu khớp đúng 100%
      const initialPct = {};
      const basePct = Math.floor(100 / allIds.length);
      const remPct = 100 - basePct * allIds.length;
      allIds.forEach((id, idx) => {
        initialPct[id] = basePct + (idx < remPct ? 1 : 0);
      });
      setPercentages(initialPct);

      setExactAmounts({});
      setErrorMsg('');
    }
  }, [group, currentUser, isOpen]);

  if (!isOpen || !group) return null;

  const parsedAmount = Math.round(Number(amount)) || 0;

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

  // Tính toán Preview phân bổ & phần dư chuẩn xác
  const calculateLivePreview = () => {
    if (parsedAmount <= 0) return { splits: [], remainder: 0, firstUserId: null };

    if (splitType === 'EQUAL') {
      const count = selectedUserIds.length;
      if (count === 0) return { splits: [], remainder: 0, firstUserId: null };
      const base = Math.floor(parsedAmount / count);
      const remainder = parsedAmount - base * count;
      const firstUserId = selectedUserIds[0];

      const splits = group.members.map((m) => {
        const uId = m.user._id;
        const isSelected = selectedUserIds.includes(uId);
        if (!isSelected) {
          return { user: m.user, amountOwed: 0, percentage: 0, isIncluded: false };
        }
        const isFirst = uId === firstUserId;
        const owed = base + (isFirst ? remainder : 0);
        const pct = ((owed / parsedAmount) * 100).toFixed(1);
        return {
          user: m.user,
          amountOwed: owed,
          percentage: pct,
          isIncluded: true,
          hasRemainder: isFirst && remainder > 0
        };
      });

      return { splits, remainder, firstUserId };
    }

    if (splitType === 'PERCENTAGE') {
      let allocated = 0;
      const membersWithPct = group.members.filter((m) => Number(percentages[m.user._id]) > 0);
      const firstUserId = membersWithPct.length > 0 ? membersWithPct[0].user._id : null;

      // Tính floor cho từng người
      let sumFloor = 0;
      const preliminary = group.members.map((m) => {
        const pct = Number(percentages[m.user._id]) || 0;
        const owed = Math.floor((pct / 100) * parsedAmount);
        sumFloor += owed;
        return { user: m.user, amountOwed: owed, percentage: pct, isIncluded: pct > 0 };
      });

      const remainder = parsedAmount - sumFloor;

      const splits = preliminary.map((item) => {
        const isFirst = item.user._id === firstUserId;
        const owed = item.amountOwed + (isFirst ? remainder : 0);
        return {
          ...item,
          amountOwed: owed,
          hasRemainder: isFirst && remainder > 0
        };
      });

      return { splits, remainder, firstUserId };
    }

    if (splitType === 'EXACT') {
      const splits = group.members.map((m) => {
        const owed = Math.round(Number(exactAmounts[m.user._id]) || 0);
        const pct = parsedAmount > 0 ? ((owed / parsedAmount) * 100).toFixed(1) : 0;
        return { user: m.user, amountOwed: owed, percentage: pct, isIncluded: owed > 0 };
      });
      return { splits, remainder: 0, firstUserId: null };
    }

    return { splits: [], remainder: 0, firstUserId: null };
  };

  const { splits: liveSplits, remainder, firstUserId } = calculateLivePreview();

  // Kiểm tra tổng phần trăm
  const totalPercentage = Number(
    Object.values(percentages)
      .reduce((sum, val) => sum + (Number(val) || 0), 0)
      .toFixed(2)
  );

  // Kiểm tra tổng tiền exact
  const totalExact = Object.values(exactAmounts).reduce(
    (sum, val) => sum + Math.round(Number(val) || 0),
    0
  );

  // KIỂM TRA ĐIỀU KIỆN MỞ KHÓA NÚT SUBMIT CHẶT CHẼ
  let isSplitValid = false;
  let splitValidationMessage = '';
  let splitValidationStatus = 'INVALID'; // 'VALID' | 'MISSING' | 'EXCESS'

  if (parsedAmount > 0) {
    if (splitType === 'EQUAL') {
      if (selectedUserIds.length > 0) {
        isSplitValid = true;
        splitValidationStatus = 'VALID';
        splitValidationMessage = 'Đã khớp 100%';
      } else {
        splitValidationMessage = 'Chưa chọn thành viên nào';
      }
    } else if (splitType === 'PERCENTAGE') {
      const diff = 100 - totalPercentage;
      if (Math.abs(diff) < 0.001) {
        isSplitValid = true;
        splitValidationStatus = 'VALID';
        splitValidationMessage = 'Đã khớp 100%';
      } else if (diff > 0) {
        splitValidationStatus = 'MISSING';
        splitValidationMessage = `Còn thiếu ${diff.toFixed(1)}%`;
      } else {
        splitValidationStatus = 'EXCESS';
        splitValidationMessage = `Vượt quá ${Math.abs(diff).toFixed(1)}%`;
      }
    } else if (splitType === 'EXACT') {
      const diff = parsedAmount - totalExact;
      if (diff === 0) {
        isSplitValid = true;
        splitValidationStatus = 'VALID';
        splitValidationMessage = 'Đã khớp 100%';
      } else if (diff > 0) {
        splitValidationStatus = 'MISSING';
        splitValidationMessage = `Còn thiếu ${formatVND(diff)}`;
      } else {
        splitValidationStatus = 'EXCESS';
        splitValidationMessage = `Vượt quá ${formatVND(Math.abs(diff))}`;
      }
    }
  }

  const isFormValid = title.trim().length > 0 && parsedAmount > 0 && isSplitValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isFormValid) {
      setErrorMsg('Vui lòng hoàn thiện đúng thông tin và đảm bảo tổng tiền chia khớp 100%');
      return;
    }

    // Chuẩn bị payload splits theo splitType
    let payloadSplits = [];

    if (splitType === 'EQUAL') {
      payloadSplits = selectedUserIds.map((userId) => ({ user: userId }));
    } else if (splitType === 'PERCENTAGE') {
      payloadSplits = group.members.map((m) => ({
        user: m.user._id,
        percentage: Number(percentages[m.user._id]) || 0
      }));
    } else if (splitType === 'EXACT') {
      payloadSplits = group.members.map((m) => ({
        user: m.user._id,
        amountOwed: Math.round(Number(exactAmounts[m.user._id]) || 0)
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

  const firstUserObj = group.members.find((m) => m.user._id === firstUserId)?.user;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div
        className="glass-modal w-full max-w-2xl rounded-t-3xl sm:rounded-3xl rounded-b-none sm:rounded-b-3xl p-5 sm:p-8 shadow-2xl relative my-0 sm:my-8 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Bar */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 sm:top-5 right-4 sm:right-5 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 sm:mb-6 pr-8 sm:pr-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
            <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-zinc-100">Thêm khoản chi tiêu mới</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 truncate max-w-[240px] sm:max-w-none">
              Phòng: <strong className="text-slate-700 dark:text-zinc-300">{group.name}</strong> • Khớp làm tròn số nguyên tuyệt đối
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Row 1: Tên khoản chi & Số tiền */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Số tiền (VNĐ) <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <div className="relative rounded-xl shadow-sm">
                <input
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  placeholder="500000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 py-2.5 pl-3.5 pr-14 text-base sm:text-sm font-semibold num-vnd bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-950/60 focus:border-emerald-500 transition-all"
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-bold text-slate-400 dark:text-zinc-500 pointer-events-none">
                  VNĐ
                </span>
              </div>
              {parsedAmount > 0 && (
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 num-vnd">
                  {formatVND(parsedAmount)}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Danh mục (Pill selector) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5 sm:mb-2">
              Danh mục chi tiêu
            </label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[36px] flex items-center justify-center ${
                    category === cat
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300 dark:ring-emerald-700 ring-offset-1 dark:ring-offset-zinc-900'
                      : 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Người thanh toán & Ngày */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Người trả tiền trước <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 py-2.5 px-3 text-base sm:text-sm bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-950/60 focus:border-emerald-500 transition-all cursor-pointer font-medium"
              >
                {group.members?.map((m) => (
                  <option key={m.user._id} value={m.user._id}>
                    {m.user.name} {m.user._id === currentUser?._id ? '(Bạn)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Ngày chi tiêu
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 py-2.5 px-3 text-base sm:text-sm bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-950/60 focus:border-emerald-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* Row 4: CHẾ ĐỘ CHIA TIỀN (Split Mode Tabs & Smart Validation Status) */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Phương thức chia tiền</span>
              </label>

              {/* Mode Switcher Tabs (with min-h-[44px] for mobile friendly touch) */}
              <div className="grid grid-cols-3 sm:flex items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs">
                <button
                  type="button"
                  onClick={() => setSplitType('EQUAL')}
                  className={`min-h-[44px] sm:min-h-[34px] px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center ${
                    splitType === 'EQUAL'
                      ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  Chia đều (=)
                </button>
                <button
                  type="button"
                  onClick={() => setSplitType('PERCENTAGE')}
                  className={`min-h-[44px] sm:min-h-[34px] px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center ${
                    splitType === 'PERCENTAGE'
                      ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  Theo % (%)
                </button>
                <button
                  type="button"
                  onClick={() => setSplitType('EXACT')}
                  className={`min-h-[44px] sm:min-h-[34px] px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center ${
                    splitType === 'EXACT'
                      ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  Số tiền lẻ (₫)
                </button>
              </div>
            </div>

            {/* BỘ ĐẾM SỐ TIỀN / PHẦN TRĂM THỜI GIAN THỰC (REAL-TIME SMART COUNTER) */}
            <div className="mb-3 p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700">
              <span className="text-slate-600 dark:text-zinc-400 font-medium">Trạng thái khớp:</span>

              <div className="flex items-center gap-2">
                {splitValidationStatus === 'VALID' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{splitValidationMessage}</span>
                  </span>
                ) : splitValidationStatus === 'MISSING' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800/60 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>{splitValidationMessage}</span>
                  </span>
                ) : splitValidationStatus === 'EXCESS' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800/60 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    <span>{splitValidationMessage}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300 font-semibold">
                    <span>{parsedAmount > 0 ? 'Vui lòng kiểm tra phân bổ' : 'Nhập số tiền để đối soát'}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Split Content: EQUAL */}
            {splitType === 'EQUAL' && (
              <div className="space-y-3 bg-slate-50/70 dark:bg-zinc-800/40 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-700/60">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                  <span>Tích chọn những người tham gia chia:</span>
                  <span className="font-bold text-slate-700 dark:text-zinc-300">
                    Đã chọn {selectedUserIds.length}/{group.members?.length} người
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.members?.map((m) => {
                    const isSelected = selectedUserIds.includes(m.user._id);
                    const previewItem = liveSplits.find((s) => s.user._id === m.user._id);
                    return (
                      <div
                        key={m.user._id}
                        onClick={() => toggleUserEqual(m.user._id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer min-h-[44px] ${
                          isSelected
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-600 text-emerald-900 dark:text-emerald-200'
                            : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0 ${
                              isSelected
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <img
                            src={m.user.avatar}
                            alt=""
                            className="w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 flex-shrink-0"
                          />
                          <span className="text-xs font-semibold truncate text-slate-800 dark:text-zinc-200">
                            {m.user.name}
                          </span>
                        </div>
                        {isSelected && parsedAmount > 0 && (
                          <div className="text-right flex-shrink-0 pl-2">
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 num-vnd block">
                              {formatVND(previewItem?.amountOwed || 0)}
                            </span>
                            {previewItem?.hasRemainder && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                (+{formatVND(remainder)} dư)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Thông báo phần dư làm tròn */}
                {remainder > 0 && firstUserObj && (
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span>
                      Phần dư lẻ <strong>{formatVND(remainder)}</strong> được tự động cộng vào <strong>{firstUserObj.name}</strong> để đảm bảo tổng khớp 100% không lệch 1 đồng.
                    </span>
                  </p>
                )}
              </div>
            )}

            {/* Split Content: PERCENTAGE */}
            {splitType === 'PERCENTAGE' && (
              <div className="space-y-3 bg-slate-50/70 dark:bg-zinc-800/40 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-700/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-zinc-400">Nhập tỷ lệ % từng người:</span>
                  <span
                    className={`font-bold ${
                      Math.abs(totalPercentage - 100) < 0.001
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : totalPercentage < 100
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
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
                        className="flex items-center justify-between gap-2.5 p-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <img
                            src={m.user.avatar}
                            alt=""
                            className="w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 flex-shrink-0"
                          />
                          <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                            {m.user.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {parsedAmount > 0 && (
                            <div className="text-right">
                              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 num-vnd block">
                                {formatVND(previewItem?.amountOwed || 0)}
                              </span>
                              {previewItem?.hasRemainder && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                  (+{formatVND(remainder)} dư)
                                </span>
                              )}
                            </div>
                          )}
                          <div className="relative w-20">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              inputMode="numeric"
                              value={pctVal}
                              onChange={(e) =>
                                setPercentages({
                                  ...percentages,
                                  [m.user._id]: e.target.value === '' ? '' : Number(e.target.value)
                                })
                              }
                              className="w-full text-right text-base sm:text-xs font-bold py-1.5 pl-2 pr-6 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-950/60 focus:border-emerald-500"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-zinc-500 font-bold pointer-events-none">
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {remainder > 0 && firstUserObj && (
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span>
                      Phần dư lẻ <strong>{formatVND(remainder)}</strong> từ việc làm tròn được cộng vào <strong>{firstUserObj.name}</strong>.
                    </span>
                  </p>
                )}
              </div>
            )}

            {/* Split Content: EXACT */}
            {splitType === 'EXACT' && (
              <div className="space-y-3 bg-slate-50/70 dark:bg-zinc-800/40 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-700/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-zinc-400">Nhập số tiền chính xác từng người:</span>
                  <span
                    className={`font-bold num-vnd ${
                      totalExact === parsedAmount && parsedAmount > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : totalExact < parsedAmount
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    Đã chia: {formatVND(totalExact)} / {formatVND(parsedAmount)}
                  </span>
                </div>

                <div className="space-y-2">
                  {group.members?.map((m) => {
                    const exactVal = exactAmounts[m.user._id] ?? '';
                    return (
                      <div
                        key={m.user._id}
                        className="flex items-center justify-between gap-2.5 p-2 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-700"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <img
                            src={m.user.avatar}
                            alt=""
                            className="w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 flex-shrink-0"
                          />
                          <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                            {m.user.name}
                          </span>
                        </div>
                        <div className="relative w-32 sm:w-36 flex-shrink-0">
                          <input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            placeholder="0"
                            value={exactVal}
                            onChange={(e) =>
                              setExactAmounts({
                                ...exactAmounts,
                                [m.user._id]: e.target.value === '' ? '' : Math.round(Number(e.target.value))
                              })
                            }
                            className="w-full text-right text-base sm:text-xs font-bold py-1.5 pl-2 pr-7 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-950/60 focus:border-emerald-500 num-vnd"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 dark:text-zinc-500 font-bold pointer-events-none">
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

          {/* Form Actions with Strict Unlocking */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-slate-100 dark:border-zinc-800">
            <div className="text-xs text-slate-500 dark:text-zinc-400">
              {!isSplitValid && parsedAmount > 0 && (
                <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Nút xác nhận sẽ mở khóa khi tổng chia khớp 100%
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:flex items-center gap-2.5 sm:gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
                className="min-h-[44px]"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={!isFormValid || loading}
                title={!isFormValid ? 'Vui lòng khớp 100% số tiền để tiếp tục' : 'Tạo khoản chi'}
                className={`min-h-[44px] ${!isFormValid ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
              >
                Thêm khoản chi
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
