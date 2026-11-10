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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="glass-modal w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Nhập mã mời phòng</h3>
            <p className="text-xs text-slate-500">Mã 6 ký tự do trưởng phòng hoặc bạn cùng phòng chia sẻ</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Mã mời (6 Ký tự) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={inviteCode}
                onChange={handleCodeChange}
                placeholder="VD: ABC123"
                autoFocus
                maxLength={6}
                className="w-full text-center text-2xl font-mono font-bold tracking-widest py-3 px-4 rounded-2xl border-2 border-slate-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 uppercase transition-all outline-none"
              />
            </div>
            <p className="text-xs text-slate-400 text-center mt-2">
              {inviteCode.length}/6 ký tự
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Bạn sẽ ngay lập tức xem được công nợ và lịch sử chi tiêu sau khi tham gia.</span>
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
              disabled={inviteCode.length < 6}
              icon={ArrowRight}
            >
              Tham gia ngay
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
