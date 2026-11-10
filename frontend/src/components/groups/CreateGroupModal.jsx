import React, { useState } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Input from '../common/Input';
import Button from '../common/Button';
import { X, Users, AlignLeft, Sparkles } from 'lucide-react';

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập tên phòng hoặc tên nhóm');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/groups', {
        name: name.trim(),
        description: description.trim()
      });

      if (res.data.success) {
        showToast(`Tạo phòng "${res.data.group.name}" thành công!`, 'success');
        setName('');
        setDescription('');
        onClose();
        if (onGroupCreated) onGroupCreated(res.data.group);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi tạo phòng';
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
        className="glass-modal w-full max-w-lg rounded-t-3xl sm:rounded-3xl rounded-b-none sm:rounded-b-3xl p-5 sm:p-7 shadow-2xl relative max-h-[92vh] sm:max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 sm:top-5 right-4 sm:right-5 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 p-2 sm:p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 sm:mb-6 pr-8">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-zinc-100">Tạo phòng / Nhóm mới</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Mã mời 6 ký tự sẽ tự động được tạo để bạn chia sẻ cho bạn cùng phòng</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Tên phòng / nhóm"
            id="groupName"
            placeholder="Ví dụ: Phòng 402 - Toà Landmark, Nhóm du lịch Đà Lạt..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={Users}
            required
            autoFocus
          />

          <Input
            label="Mô tả (Không bắt buộc)"
            id="groupDescription"
            placeholder="Ví dụ: Tiền trọ, tiền chợ và phí sinh hoạt hàng tháng"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            icon={AlignLeft}
          />

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/60 text-xs text-slate-600 dark:text-zinc-400 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              Sau khi tạo nhóm, bạn sẽ nhận được <strong>Mã mời riêng biệt</strong>. Bạn cùng phòng chỉ cần nhập mã này là vào được ngay, không cần xét duyệt phức tạp.
            </span>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Tạo phòng ngay
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
