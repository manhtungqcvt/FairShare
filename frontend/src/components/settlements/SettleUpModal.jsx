import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { formatVND } from '../../utils/format';
import Button from '../common/Button';
import Input from '../common/Input';
import {
  X,
  HandCoins,
  ArrowRight,
  DollarSign,
  Calendar,
  FileText,
  ShieldCheck,
  Clock,
  Info
} from 'lucide-react';

export default function SettleUpModal({
  isOpen,
  onClose,
  group,
  currentUser,
  prefill = null, // { payer, payee, amount }
  onSettlementCreated
}) {
  const { showToast } = useToast();

  const [payer, setPayer] = useState('');
  const [payee, setPayee] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('Thanh toán công nợ');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (group?.members && group.members.length > 0) {
      if (prefill) {
        setPayer(prefill.payer || currentUser?._id);
        setPayee(prefill.payee || '');
        setAmount(prefill.amount ? prefill.amount.toString() : '');
      } else {
        setPayer(currentUser?._id || group.members[0].user._id);
        const otherMember = group.members.find((m) => m.user._id !== currentUser?._id);
        setPayee(otherMember ? otherMember.user._id : group.members[0].user._id);
      }
      setErrorMsg('');
    }
  }, [group, currentUser, prefill, isOpen]);

  if (!isOpen || !group) return null;

  const parsedAmount = Math.round(Number(amount)) || 0;
  const isCreatorPayee = currentUser?._id === payee;
  const isCreatorPayer = currentUser?._id === payer;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!payer || !payee) {
      setErrorMsg('Vui lòng chọn người trả và người nhận');
      return;
    }

    if (payer === payee) {
      setErrorMsg('Người trả tiền và người nhận không được trùng nhau');
      return;
    }

    if (parsedAmount <= 0) {
      setErrorMsg('Số tiền thanh toán phải là số nguyên dương lớn hơn 0');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/settlements', {
        group: group._id,
        payer,
        payee,
        amount: parsedAmount,
        note: note.trim() || 'Thanh toán công nợ',
        date
      });

      if (res.data.success) {
        const isConfirmed = res.data.settlement?.status === 'CONFIRMED';
        if (isConfirmed) {
          showToast('Đã xác nhận thanh toán công nợ thành công! Số dư đã được cấn trừ.', 'success');
        } else {
          showToast('Đã gửi yêu cầu thanh toán! Đang chờ người nhận xác nhận.', 'info');
        }
        onClose();
        if (onSettlementCreated) onSettlementCreated(res.data.settlement);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi tạo giao dịch thanh toán';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const payerObj = group.members.find((m) => m.user._id === payer)?.user;
  const payeeObj = group.members.find((m) => m.user._id === payee)?.user;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="glass-modal w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
            <HandCoins className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Trả tiền ngay (Settle Up)</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Ghi nhận thanh toán chuyển khoản & xác thực 2 chiều
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Visual transfer preview banner */}
        {payerObj && payeeObj && (
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-zinc-900 border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={payerObj.avatar}
                alt=""
                className="w-10 h-10 rounded-full ring-2 ring-emerald-300 dark:ring-emerald-600 bg-white dark:bg-zinc-800"
              />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Người trả</span>
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{payerObj.name}</p>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 num-vnd">
                {parsedAmount > 0 ? formatVND(parsedAmount) : '... ₫'}
              </span>
              <div className="flex items-center text-emerald-500 dark:text-emerald-400 mt-0.5">
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-right">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-zinc-500">Người nhận</span>
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">{payeeObj.name}</p>
              </div>
              <img
                src={payeeObj.avatar}
                alt=""
                className="w-10 h-10 rounded-full ring-2 ring-teal-300 dark:ring-teal-600 bg-white dark:bg-zinc-800"
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Người trả tiền <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <select
                value={payer}
                onChange={(e) => setPayer(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 py-2.5 px-3 text-base sm:text-sm bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-950/60 focus:border-emerald-500 font-medium cursor-pointer"
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
                Người nhận tiền <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <select
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 py-2.5 px-3 text-base sm:text-sm bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-950/60 focus:border-emerald-500 font-medium cursor-pointer"
              >
                {group.members?.map((m) => (
                  <option key={m.user._id} value={m.user._id}>
                    {m.user.name} {m.user._id === currentUser?._id ? '(Bạn)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Số tiền thanh toán (VNĐ) <span className="text-rose-500 dark:text-rose-400">*</span>
            </label>
            <div className="relative rounded-xl shadow-sm">
              <input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                placeholder="100000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 py-2.5 pl-3.5 pr-14 text-base sm:text-sm font-semibold num-vnd bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-950/60 focus:border-emerald-500 transition-all"
              />
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-bold text-slate-400 dark:text-zinc-500 pointer-events-none">
                VNĐ
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Ghi chú"
              id="note"
              placeholder="VD: Trả tiền chợ, ck MoMo..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              icon={FileText}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                Ngày thanh toán
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 py-2.5 px-3 text-base sm:text-sm bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-950/60 focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* 2-way confirmation notice */}
          <div className="p-3 rounded-2xl border text-xs bg-slate-50 dark:bg-zinc-800/60 border-slate-200 dark:border-zinc-700 space-y-1">
            {isCreatorPayee ? (
              <p className="text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>
                  Bạn là người nhận tiền: Giao dịch sẽ được <strong>xác nhận ngay lập tức</strong> và cấn trừ công nợ.
                </span>
              </p>
            ) : (
              <p className="text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span>
                  Bạn đang tạo giao dịch: Trạng thái sẽ là <strong>Chờ xác nhận</strong> cho đến khi người nhận bấm duyệt.
                </span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
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
              icon={HandCoins}
            >
              Gửi yêu cầu thanh toán
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
