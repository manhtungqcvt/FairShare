import React, { useState } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Button from '../common/Button';
import { X, KeyRound, ArrowRight, ShieldCheck } from 'lucide-react';

export default function JoinGroupModal({ isOpen, onClose, onGroupJoined }) {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleCodeChange = (e) => {
    // Tự động chuyển thành chữ hoa và bỏ khoảng trắng
    const clean = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    setInviteCode(clean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (inviteCode.length < 6) {
      setErrorMsg('Mã mời phải có đúng 6 ký tự');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/groups/join', { inviteCode });
      if (res.data.success) {
        showToast(res.data.message || 'Tham gia nhóm thành công!', 'success');
        setInviteCode('');
        onClose();
        if (onGroupJoined) onGroupJoined(res.data.group);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Mã mời không chính xác hoặc có lỗi xảy ra';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="glass-modal w-full max-w-md rounded-t-3xl sm:rounded-3xl rounded-b-none sm:rounded-b-3xl p-5 sm:p-7 shadow-2xl relative max-h-[92vh] sm:max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full mx-auto mb-3 sm:hidden" />

        <button
          onClick={onClose}
          className="absolute top-4 sm:top-5 right-4 sm:right-5 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 p-2 sm:p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 sm:mb-6 pr-8">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center flex-shrink-0">
            <KeyRound className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-zinc-100">Nhập mã mời phòng</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Mã 6 ký tự do trưởng phòng hoặc bạn cùng phòng chia sẻ</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
              Mã mời (6 Ký tự) <span className="text-rose-500 dark:text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={inviteCode}
                onChange={handleCodeChange}
                placeholder="VD: ABC123"
                autoFocus
                maxLength={6}
                className="w-full text-center text-2xl font-mono font-bold tracking-widest py-3 px-4 rounded-2xl border-2 border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-300 dark:placeholder:text-zinc-600 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-4 focus:ring-teal-100 dark:focus:ring-teal-950/60 uppercase transition-all outline-none"
              />
            </div>
            <p className="text-xs text-slate-400 dark:text-zinc-500 text-center mt-2">
              {inviteCode.length}/6 ký tự
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 text-xs text-slate-600 dark:text-zinc-400 border border-slate-100 dark:border-zinc-700/60">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>Bạn sẽ ngay lập tức xem được công nợ và lịch sử chi tiêu sau khi tham gia.</span>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={inviteCode.length < 6}
              icon={ArrowRight}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Tham gia ngay
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
