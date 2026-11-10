import React from 'react';
import { formatVND } from '../../utils/format';
import Button from '../common/Button';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  HandCoins,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  DollarSign
} from 'lucide-react';

export default function BalanceSummaryBento({
  balancesData,
  currentUser,
  onOpenSettleUp
}) {
  if (!balancesData) return null;

  const {
    myBalance = 0,
    totalGroupExpense = 0,
    memberBalances = [],
    simplifiedDebts = []
  } = balancesData;

  const isPositive = myBalance > 0;
  const isNegative = myBalance < 0;
  const isBalanced = myBalance === 0;

  const numMembers = memberBalances.length || 1;
  const avgExpensePerMember = Math.round(totalGroupExpense / numMembers);

  return (
    <div className="space-y-6">
      {/* Top Bento Row: Personal Status + Total Spend + Debt Simplification */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* CARD 1: Trạng thái cá nhân (Bento Card nổi bật) */}
        <div
          className={`rounded-3xl p-6 transition-all duration-200 border shadow-card flex flex-col justify-between ${
            isPositive
              ? 'bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-zinc-900 border-emerald-200 dark:border-emerald-800/60'
              : isNegative
              ? 'bg-gradient-to-br from-rose-50 via-amber-50/40 to-white dark:from-rose-950/40 dark:via-amber-950/20 dark:to-zinc-900 border-rose-200 dark:border-rose-800/60'
              : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : isNegative ? (
                  <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                ) : (
                  <Scale className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                )}
                <span>Vị thế của bạn</span>
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isPositive
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                    : isNegative
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                }`}
              >
                {isPositive
                  ? 'Chủ nợ'
                  : isNegative
                  ? 'Người nợ'
                  : 'Đã hòa'}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
              {isPositive
                ? 'Nhóm cần hoàn trả lại cho bạn'
                : isNegative
                ? 'Bạn cần hoàn trả cho các bạn cùng phòng'
                : 'Bạn không nợ ai và không ai nợ bạn'}
            </p>

            <h3
              className={`text-3xl font-extrabold mt-2 num-vnd tracking-tight ${
                isPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : isNegative
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-800 dark:text-zinc-100'
              }`}
            >
              {isPositive && '+'}
              {formatVND(myBalance)}
            </h3>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100/80 dark:border-zinc-800">
            {isNegative ? (
              <Button
                variant="danger"
                size="sm"
                fullWidth
                icon={HandCoins}
                onClick={() => onOpenSettleUp()}
                className="shadow-sm hover:shadow"
              >
                Trả tiền ngay (Settle Up)
              </Button>
            ) : (
              <Button
                variant="emeraldSubtle"
                size="sm"
                fullWidth
                icon={HandCoins}
                onClick={() => onOpenSettleUp()}
              >
                Ghi nhận thanh toán
              </Button>
            )}
          </div>
        </div>

        {/* CARD 2: Tổng chi tiêu phòng & Trung bình */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200/90 dark:border-zinc-800 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Tổng chi tiêu phòng</span>
              </span>
              <span className="text-xs text-slate-400 dark:text-zinc-500 font-medium">Toàn thời gian</span>
            </div>

            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100 num-vnd tracking-tight">
              {formatVND(totalGroupExpense)}
            </h3>

            <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-700/60 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-zinc-400">Số lượng thành viên:</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">{numMembers} người</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-zinc-400">Trung bình mỗi người:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 num-vnd">
                  ~{formatVND(avgExpensePerMember)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>Tự động bù trừ khi có chi tiêu mới</span>
          </div>
        </div>

        {/* CARD 3: Giao dịch tối giản hoá (Debt Simplification) */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200/90 dark:border-zinc-800 shadow-card flex flex-col justify-between md:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Kế hoạch trả nợ tối ưu</span>
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300">
                {simplifiedDebts.length} giao dịch
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-3">
              Thuật toán đã tối giản để giảm thiểu tối đa số lần chuyển khoản:
            </p>

            {simplifiedDebts.length > 0 ? (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {simplifiedDebts.map((item, idx) => {
                  const isMyDebt = item.from === currentUser?._id;
                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-2xl border text-xs flex items-center justify-between transition-colors ${
                        isMyDebt
                          ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                          : 'bg-slate-50 dark:bg-zinc-800/60 border-slate-200/70 dark:border-zinc-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-bold text-slate-800 dark:text-zinc-200 truncate max-w-[80px]">
                          {isMyDebt ? 'Bạn' : item.fromUser?.name}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 flex-shrink-0" />
                        <span className="font-bold text-slate-800 dark:text-zinc-200 truncate max-w-[80px]">
                          {item.to === currentUser?._id ? 'Bạn' : item.toUser?.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 num-vnd">
                          {formatVND(item.amount)}
                        </span>
                        {isMyDebt && (
                          <button
                            onClick={() =>
                              onOpenSettleUp({
                                payer: item.from,
                                payee: item.to,
                                amount: item.amount
                              })
                            }
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-colors cursor-pointer"
                          >
                            Trả
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/60 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
                <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Không có công nợ tồn đọng!</p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">Tất cả mọi người đã sòng phẳng.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: Bảng số dư chi tiết từng thành viên */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200/90 dark:border-zinc-800 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-base font-bold text-slate-900 dark:text-zinc-100">
              Bảng đối soát số dư của từng thành viên
            </h4>
          </div>
          <span className="text-xs text-slate-500 dark:text-zinc-400 hidden sm:inline">
            Cập nhật liên tục theo thời gian thực (Rolling Net Balance)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {memberBalances.map((m) => {
            const bal = Number(m.balance) || 0;
            const isPos = bal > 0;
            const isNeg = bal < 0;
            const isMe = m.user?._id === currentUser?._id;

            return (
              <div
                key={m.user?._id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                  isMe
                    ? 'bg-slate-50 dark:bg-zinc-800/60 border-emerald-300 dark:border-emerald-600/60 ring-1 ring-emerald-300/40 dark:ring-emerald-500/20'
                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={m.user?.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 ring-2 ring-slate-100 dark:ring-zinc-800"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-900 dark:text-zinc-100">{m.user?.name}</p>
                      {isMe && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                          Bạn
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                      {m.role === 'ADMIN' ? 'Trưởng phòng' : 'Thành viên'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-bold num-vnd block ${
                      isPos ? 'text-emerald-600 dark:text-emerald-400' : isNeg ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-zinc-400'
                    }`}
                  >
                    {isPos && '+'}
                    {formatVND(bal)}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                    {isPos ? 'Được nhận' : isNeg ? 'Cần trả' : 'Cân bằng'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
