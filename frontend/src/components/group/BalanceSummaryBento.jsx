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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CARD 1: Trạng thái cá nhân (Bento Card nổi bật) */}
        <div
          className={`rounded-3xl p-6 transition-all duration-200 border shadow-card flex flex-col justify-between ${
            isPositive
              ? 'bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-emerald-200'
              : isNegative
              ? 'bg-gradient-to-br from-rose-50 via-amber-50/40 to-white border-rose-200'
              : 'bg-white border-slate-200'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                {isPositive ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : isNegative ? (
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                ) : (
                  <Scale className="w-4 h-4 text-slate-500" />
                )}
                <span>Vị thế của bạn</span>
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isPositive
                    ? 'bg-emerald-100 text-emerald-800'
                    : isNegative
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {isPositive
                  ? 'Chủ nợ'
                  : isNegative
                  ? 'Người nợ'
                  : 'Đã hòa'}
              </span>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              {isPositive
                ? 'Nhóm cần hoàn trả lại cho bạn'
                : isNegative
                ? 'Bạn cần hoàn trả cho các bạn cùng phòng'
                : 'Bạn không nợ ai và không ai nợ bạn'}
            </p>

            <h3
              className={`text-3xl font-extrabold mt-2 num-vnd tracking-tight ${
                isPositive
                  ? 'text-emerald-600'
                  : isNegative
                  ? 'text-rose-600'
                  : 'text-slate-800'
              }`}
            >
              {isPositive && '+'}
              {formatVND(myBalance)}
            </h3>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100/80">
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
        <div className="glass-card rounded-3xl p-6 border border-slate-200/90 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Tổng chi tiêu phòng</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">Toàn thời gian</span>
            </div>

            <h3 className="text-3xl font-extrabold text-slate-900 num-vnd tracking-tight">
              {formatVND(totalGroupExpense)}
            </h3>

            <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Số lượng thành viên:</span>
                <span className="font-bold text-slate-800">{numMembers} người</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Trung bình mỗi người:</span>
                <span className="font-bold text-emerald-700 num-vnd">
                  ~{formatVND(avgExpensePerMember)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Tự động bù trừ khi có chi tiêu mới</span>
          </div>
        </div>

        {/* CARD 3: Giao dịch tối giản hoá (Debt Simplification) */}
        <div className="glass-card rounded-3xl p-6 border border-slate-200/90 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-600" />
                <span>Kế hoạch trả nợ tối ưu</span>
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                {simplifiedDebts.length} giao dịch
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-3">
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
                          ? 'bg-rose-50/70 border-rose-200'
                          : 'bg-slate-50 border-slate-200/70'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-bold text-slate-800 truncate max-w-[80px]">
                          {isMyDebt ? 'Bạn' : item.fromUser?.name}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="font-bold text-slate-800 truncate max-w-[80px]">
                          {item.to === currentUser?._id ? 'Bạn' : item.toUser?.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-700 num-vnd">
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
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-emerald-900">Không có công nợ tồn đọng!</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Tất cả mọi người đã sòng phẳng.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: Bảng số dư chi tiết từng thành viên */}
      <div className="glass-card rounded-3xl p-6 border border-slate-200/90 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h4 className="text-base font-bold text-slate-900">
              Bảng đối soát số dư của từng thành viên
            </h4>
          </div>
          <span className="text-xs text-slate-500">
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
                    ? 'bg-slate-50 border-emerald-300 ring-1 ring-emerald-300/40'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={m.user?.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full bg-slate-100 ring-2 ring-slate-100"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-900">{m.user?.name}</p>
                      {isMe && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                          Bạn
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {m.role === 'ADMIN' ? 'Trưởng phòng' : 'Thành viên'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-bold num-vnd block ${
                      isPos ? 'text-emerald-600' : isNeg ? 'text-rose-600' : 'text-slate-500'
                    }`}
                  >
                    {isPos && '+'}
                    {formatVND(bal)}
                  </span>
                  <span className="text-[10px] text-slate-400">
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
