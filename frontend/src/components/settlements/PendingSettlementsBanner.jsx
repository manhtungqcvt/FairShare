import React, { useState } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { formatVND, formatDateTime } from '../../utils/format';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Loader2
} from 'lucide-react';

export default function PendingSettlementsBanner({
  pendingSettlements = [],
  currentUser,
  groupId,
  onActionComplete
}) {
  const { showToast } = useToast();
  const [processingId, setProcessingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  if (!pendingSettlements || pendingSettlements.length === 0) {
    return null;
  }

  const handleConfirm = async (settlement) => {
    setProcessingId(settlement._id);
    try {
      const res = await api.patch(`/groups/${groupId}/settlements/${settlement._id}/confirm`);
      if (res.data.success) {
        showToast(
          `Đã xác nhận nhận đủ ${formatVND(settlement.amount)} từ ${settlement.payer?.name || 'thành viên'}! Công nợ đã được cấn trừ.`,
          'success'
        );
        if (onActionComplete) onActionComplete();
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Không thể xác nhận thanh toán';
      showToast(msg, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (settlement) => {
    setProcessingId(settlement._id);
    try {
      const res = await api.patch(`/groups/${groupId}/settlements/${settlement._id}/reject`, {
        reason: rejectReason.trim() || 'Người nhận chưa thấy tiền vào tài khoản'
      });
      if (res.data.success) {
        showToast('Đã từ chối khoản thanh toán', 'info');
        setRejectingId(null);
        setRejectReason('');
        if (onActionComplete) onActionComplete();
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Không thể từ chối thanh toán';
      showToast(msg, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2 px-1">
        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300">
          Giao dịch chờ xác nhận 2 chiều ({pendingSettlements.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {pendingSettlements.map((settlement) => {
          const payerId = settlement.payer?._id || settlement.payer;
          const payeeId = settlement.payee?._id || settlement.payee;
          const currentUserId = currentUser?._id;

          const isPayee = payeeId === currentUserId;
          const isPayer = payerId === currentUserId;
          const isBusy = processingId === settlement._id;
          const isPromptingReject = rejectingId === settlement._id;

          return (
            <div
              key={settlement._id}
              className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-sm ${
                isPayee
                  ? 'bg-gradient-to-r from-amber-50/90 via-emerald-50/40 to-white dark:from-amber-950/40 dark:via-emerald-950/20 dark:to-zinc-900 border-amber-200/90 dark:border-amber-800/60 ring-1 ring-amber-300/40 dark:ring-amber-500/20'
                  : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-800/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Information Left */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                        Chờ xác nhận
                      </span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 num-vnd">
                        {formatVND(settlement.amount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-300 flex-wrap">
                      <span className="font-semibold">{settlement.payer?.name} {isPayer && '(Bạn)'}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                      <span className="font-semibold">{settlement.payee?.name} {isPayee && '(Bạn)'}</span>
                      {settlement.note && (
                        <span className="text-slate-500 dark:text-zinc-400 italic">• "{settlement.note}"</span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Tạo lúc {formatDateTime(settlement.createdAt || settlement.date)}
                    </p>

                    {/* Role specific message */}
                    {isPayee ? (
                      <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300 pt-1 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <span>
                          Vui lòng kiểm tra tài khoản nhận. Nhấn <strong>"Xác nhận đã nhận tiền"</strong> để cấn trừ nợ.
                        </span>
                      </p>
                    ) : isPayer ? (
                      <p className="text-xs text-slate-600 dark:text-zinc-400 pt-1">
                        Đang chờ <strong>{settlement.payee?.name}</strong> kiểm tra và xác nhận đã nhận đủ tiền.
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-zinc-400 pt-1">
                        Khoản trả nợ đang chờ người nhận ({settlement.payee?.name}) duyệt.
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions Right (Only payee can confirm or reject) */}
                {isPayee && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200/50 dark:border-amber-800/40">
                    {!isPromptingReject ? (
                      <>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setRejectingId(settlement._id)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-white dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-800 shadow-xs transition-colors cursor-pointer disabled:opacity-50 min-h-[44px] sm:min-h-[38px]"
                        >
                          <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                          <span>Từ chối</span>
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleConfirm(settlement)}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50 min-h-[44px] sm:min-h-[38px]"
                        >
                          {isBusy ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          <span>Xác nhận đã nhận tiền</span>
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="text"
                          placeholder="Lý do từ chối (tùy chọn)..."
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="text-xs px-2.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-rose-400"
                        />
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleReject(settlement)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 cursor-pointer disabled:opacity-50"
                        >
                          {isBusy ? 'Đang gửi...' : 'Gửi từ chối'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setRejectingId(null)}
                          className="px-2 py-1.5 text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
