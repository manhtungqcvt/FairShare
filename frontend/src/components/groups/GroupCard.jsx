import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatVND } from '../../utils/format';
import { Users, Copy, Check, ArrowRight, DollarSign } from 'lucide-react';

export default function GroupCard({ group }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopyCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const myBalance = Number(group.myBalance) || 0;
  const isPositive = myBalance > 0;
  const isNegative = myBalance < 0;

  return (
    <div
      onClick={() => navigate(`/groups/${group._id}`)}
      className="glass-card rounded-3xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover border border-slate-200/90 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-500/50 flex flex-col justify-between cursor-pointer group relative overflow-hidden"
    >
      {/* Decorative top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-80 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Top bar: Title and Invite Code Chip */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
              {group.name}
            </h3>
            {group.description && (
              <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                {group.description}
              </p>
            )}
          </div>

          {/* Invite Code Chip */}
          <button
            type="button"
            onClick={handleCopyCode}
            title="Bấm để sao chép mã mời"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 text-xs font-mono font-bold tracking-wider transition-all cursor-pointer flex-shrink-0"
          >
            <span>{group.inviteCode}</span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
            )}
          </button>
        </div>

        {/* Member Avatars Stack */}
        <div className="flex items-center justify-between py-3 my-2 border-y border-slate-100 dark:border-zinc-800">
          <div className="flex items-center -space-x-2 overflow-hidden">
            {group.members?.slice(0, 4).map((member, idx) => (
              <img
                key={member.user?._id || idx}
                src={member.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.user?.name || idx)}`}
                alt={member.user?.name || 'Thành viên'}
                title={member.user?.name || 'Thành viên'}
                className="w-7 h-7 rounded-full ring-2 ring-white dark:ring-zinc-900 object-cover bg-slate-100 dark:bg-zinc-800"
              />
            ))}
            {group.members?.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 ring-2 ring-white dark:ring-zinc-900 flex items-center justify-center text-[10px] font-bold">
                +{group.members.length - 4}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400 font-medium">
            <Users className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
            <span>{group.members?.length || 0} thành viên</span>
          </div>
        </div>

        {/* Total Expense Stats */}
        <div className="flex items-center justify-between text-xs py-1">
          <span className="text-slate-500 dark:text-zinc-400 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
            Tổng chi tiêu nhóm:
          </span>
          <span className="font-semibold text-slate-800 dark:text-zinc-200 num-vnd">
            {formatVND(group.totalSpent || 0)}
          </span>
        </div>
      </div>

      {/* Footer: User Balance Badge & Action */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <span className="text-[11px] block uppercase font-semibold text-slate-400 dark:text-zinc-500 tracking-wider">
            Số dư của bạn
          </span>
          <span
            className={`text-sm font-bold num-vnd ${
              isPositive
                ? 'text-emerald-600 dark:text-emerald-400'
                : isNegative
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-600 dark:text-zinc-400'
            }`}
          >
            {isPositive && '+'}
            {formatVND(myBalance)}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
          <span>Chi tiết</span>
          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}
