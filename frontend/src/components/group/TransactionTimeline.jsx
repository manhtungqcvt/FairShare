import React, { useState } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { formatVND, formatDateTime } from '../../utils/format';
import {
  Receipt,
  HandCoins,
  ChevronDown,
  ChevronUp,
  Trash2,
  Calendar,
  Tag,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck
} from 'lucide-react';

export default function TransactionTimeline({
  history = [],
  currentUser,
  isAdmin = false,
  onItemDeleted
}) {
  const { showToast } = useToast();
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'EXPENSE' | 'SETTLEMENT'
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDelete = async (item, e) => {
    e.stopPropagation();
    if (!window.confirm(`Bạn có chắc chắn muốn xóa giao dịch "${item.title || 'Thanh toán'}" này không?`)) {
      return;
    }

    setDeletingId(item._id);
    try {
      const endpoint = item.itemType === 'EXPENSE' ? `/expenses/${item._id}` : `/settlements/${item._id}`;
      const res = await api.delete(endpoint);
      if (res.data.success) {
        showToast('Đã xóa giao dịch thành công!', 'success');
        if (onItemDeleted) onItemDeleted();
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Không thể xóa giao dịch';
      showToast(msg, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Lọc lịch sử
  const filteredHistory = history.filter((item) => {
    if (filterType === 'EXPENSE') return item.itemType === 'EXPENSE';
    if (filterType === 'SETTLEMENT') return item.itemType === 'SETTLEMENT';
    return true;
  });

  return (
    <div className="glass-card rounded-3xl p-6 border border-slate-200/90 dark:border-zinc-800 shadow-card space-y-5 animate-in fade-in duration-150">
      {/* Timeline Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h4 className="text-base font-bold text-slate-900 dark:text-zinc-100">
            Bảng sao kê lịch sử giao dịch
          </h4>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
            {filteredHistory.length}
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilterType('EXPENSE')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              filterType === 'EXPENSE'
                ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            Khoản chi tiêu
          </button>
          <button
            onClick={() => setFilterType('SETTLEMENT')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              filterType === 'SETTLEMENT'
                ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            Trả nợ
          </button>
        </div>
      </div>

      {/* Timeline items list */}
      {filteredHistory.length > 0 ? (
        <div className="space-y-3">
          {filteredHistory.map((item) => {
            const isExpense = item.itemType === 'EXPENSE';
            const isExpanded = expandedId === item._id;

            // Quyền xóa: Admin, người tạo hoặc người trả tiền (theo Rule 3)
            const canDelete =
              isAdmin ||
              (isExpense &&
                (item.createdBy?._id === currentUser?._id || item.paidBy?._id === currentUser?._id)) ||
              (!isExpense &&
                (item.payer?._id === currentUser?._id || item.payee?._id === currentUser?._id));

            return (
              <div
                key={item._id}
                onClick={() => isExpense && toggleExpand(item._id)}
                className={`p-4 rounded-2xl border transition-all duration-200 ${
                  isExpense
                    ? 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:shadow-sm cursor-pointer'
                    : item.status === 'CONFIRMED'
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/50'
                    : item.status === 'REJECTED'
                    ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/50 opacity-80'
                    : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-800/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Badge Icon */}
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        isExpense
                          ? 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                          : item.status === 'CONFIRMED'
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                          : item.status === 'REJECTED'
                          ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                          : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {isExpense ? (
                        <Receipt className="w-5 h-5" />
                      ) : item.status === 'CONFIRMED' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : item.status === 'REJECTED' ? (
                        <XCircle className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>

                    {/* Content Details */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                          {item.title}
                        </h5>

                        {isExpense && item.category && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
                            {item.category}
                          </span>
                        )}

                        {!isExpense && (
                          <>
                            {item.status === 'CONFIRMED' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span>Đã tất toán</span>
                              </span>
                            )}
                            {item.status === 'PENDING' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                <span>Chờ xác nhận</span>
                              </span>
                            )}
                            {item.status === 'REJECTED' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                <span>Từ chối</span>
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Subtitle: Who paid for whom */}
                      <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                        {isExpense ? (
                          <>
                            <strong className="text-slate-800 dark:text-zinc-200">{item.paidBy?.name}</strong> đã trả trước{' '}
                            • {item.splits?.length || 0} người chia tiền
                          </>
                        ) : (
                          <span className="flex items-center gap-1.5 flex-wrap">
                            <strong className="text-slate-800 dark:text-zinc-200">{item.payer?.name}</strong>
                            <ArrowRight className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
                            <strong className="text-slate-800 dark:text-zinc-200">{item.payee?.name}</strong>
                            {item.note && <span className="text-slate-400 italic">({item.note})</span>}
                          </span>
                        )}
                      </p>

                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                        {formatDateTime(item.date || item.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Right side: Amount & Expand/Delete */}
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span
                        className={`text-base font-extrabold num-vnd block ${
                          isExpense
                            ? 'text-slate-900 dark:text-zinc-100'
                            : item.status === 'CONFIRMED'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : item.status === 'REJECTED'
                            ? 'text-rose-600 dark:text-rose-400 line-through'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {formatVND(item.amount)}
                      </span>
                      {isExpense && (
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block sm:hidden">
                          {isExpanded ? 'Thu gọn' : 'Chi tiết'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {isExpense && (
                        <button
                          type="button"
                          className="p-1 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          disabled={deletingId === item._id}
                          onClick={(e) => handleDelete(item, e)}
                          title="Xóa giao dịch"
                          className="p-1 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* EXPANDABLE SPLIT DETAILS */}
                {isExpense && isExpanded && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-800/60 -mx-4 -mb-4 p-4 rounded-b-2xl animate-in fade-in duration-150">
                    <p className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider mb-2.5">
                      Chi tiết phần chia của từng thành viên:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {item.splits?.map((split, sIdx) => {
                        const isMe = split.user?._id === currentUser?._id;
                        return (
                          <div
                            key={split.user?._id || sIdx}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                              isMe
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
                                : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={split.user?.avatar}
                                alt=""
                                className="w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800"
                              />
                              <span className="font-semibold text-slate-800 dark:text-zinc-200">
                                {split.user?.name} {isMe && '(Bạn)'}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-slate-900 dark:text-zinc-100 num-vnd block">
                                {formatVND(split.amountOwed)}
                              </span>
                              {split.percentage && (
                                <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                                  {split.percentage}%
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty History */
        <div className="text-center py-10 px-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 mx-auto flex items-center justify-center mb-2">
            <Receipt className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">Chưa có giao dịch nào</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Các khoản chi tiêu hoặc quyết toán nợ mới sẽ xuất hiện tại đây theo dòng thời gian.
          </p>
        </div>
      )}
    </div>
  );
}
