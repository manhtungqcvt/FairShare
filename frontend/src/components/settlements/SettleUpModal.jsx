import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { formatVND } from '../../utils/format';
import Button from '../common/Button';
import Input from '../common/Input';
import { X, HandCoins, ArrowRight, DollarSign, Calendar, FileText } from 'lucide-react';

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
    }
  }, [group, currentUser, prefill, isOpen]);

  if (!isOpen || !group) return null;

  const parsedAmount = Number(amount) || 0;

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
      setErrorMsg('Số tiền thanh toán phải lớn hơn 0');
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
        showToast('Ghi nhận thanh toán quyết toán thành công! Công nợ đã được trừ.', 'success');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="glass-modal w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <HandCoins className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Trả tiền ngay (Settle Up)</h3>
            <p className="text-xs text-slate-500">
              Ghi nhận khoản thanh toán chuyển khoản giữa 2 thành viên
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Visual transfer preview banner */}
        {payerObj && payeeObj && (
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={payerObj.avatar}
                alt=""
                className="w-10 h-10 rounded-full ring-2 ring-emerald-300 bg-white"
              />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Người trả</span>
                <p className="text-xs font-bold text-slate-800">{payerObj.name}</p>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xs font-extrabold text-emerald-700 num-vnd">
                {parsedAmount > 0 ? formatVND(parsedAmount) : '... ₫'}
              </span>
              <div className="flex items-center text-emerald-500 mt-0.5">
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-right">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Người nhận</span>
                <p className="text-xs font-bold text-slate-800">{payeeObj.name}</p>
              </div>
              <img
                src={payeeObj.avatar}
                alt=""
                className="w-10 h-10 rounded-full ring-2 ring-teal-300 bg-white"
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Người trả tiền <span className="text-rose-500">*</span>
              </label>
              <select
                value={payer}
                onChange={(e) => setPayer(e.target.value)}
                className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 font-medium"
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
                Người nhận tiền <span className="text-rose-500">*</span>
              </label>
              <select
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 font-medium"
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
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Số tiền thanh toán (VNĐ) <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-xl shadow-sm">
              <input
                type="number"
                min="1000"
                step="1000"
                placeholder="100000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 py-2.5 pl-3.5 pr-14 text-sm font-semibold num-vnd bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
              />
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-bold text-slate-400 pointer-events-none">
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
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Ngày thanh toán
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 font-medium"
              />
            </div>
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
              Xác nhận trả tiền
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
