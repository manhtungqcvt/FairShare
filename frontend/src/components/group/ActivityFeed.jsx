import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { formatDateTime, formatVND } from '../../utils/format';
import {
  History,
  Receipt,
  FileEdit,
  Trash2,
  HandCoins,
  CheckCircle2,
  XCircle,
  UserPlus,
  UserMinus,
  Clock,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const ACTION_CONFIG = {
  CREATE_EXPENSE: {
    label: 'Thêm chi tiêu',
    icon: Receipt,
    color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
  },
  UPDATE_EXPENSE: {
    label: 'Sửa chi tiêu',
    icon: FileEdit,
    color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
  },
  DELETE_EXPENSE: {
    label: 'Xóa chi tiêu',
    icon: Trash2,
    color: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
  },
  CREATE_SETTLEMENT: {
    label: 'Tạo trả nợ',
    icon: HandCoins,
    color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60'
  },
  CONFIRM_SETTLEMENT: {
    label: 'Xác nhận trả nợ',
    icon: CheckCircle2,
    color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
  },
  REJECT_SETTLEMENT: {
    label: 'Từ chối trả nợ',
    icon: XCircle,
    color: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
  },
  MEMBER_JOIN: {
    label: 'Thành viên mới',
    icon: UserPlus,
    color: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/60'
  },
  MEMBER_LEAVE: {
    label: 'Rời nhóm',
    icon: UserMinus,
    color: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
  }
};

export default function ActivityFeed({ groupId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('ALL');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/groups/${groupId}/activities`);
      if (res.data.success) {
        setActivities(res.data.activities);
      }
    } catch (error) {
      console.error('Lỗi tải nhật ký hoạt động:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchActivities();
    }
  }, [groupId]);

  const filteredLogs = activities.filter((act) => {
    if (filterAction === 'ALL') return true;
    if (filterAction === 'EXPENSE') {
      return ['CREATE_EXPENSE', 'UPDATE_EXPENSE', 'DELETE_EXPENSE'].includes(act.action);
    }
    if (filterAction === 'SETTLEMENT') {
      return ['CREATE_SETTLEMENT', 'CONFIRM_SETTLEMENT', 'REJECT_SETTLEMENT'].includes(act.action);
    }
    if (filterAction === 'MEMBER') {
      return ['MEMBER_JOIN', 'MEMBER_LEAVE'].includes(act.action);
    }
    return act.action === filterAction;
  });

  return (
    <div className="glass-card rounded-3xl p-6 border border-slate-200/90 dark:border-zinc-800 shadow-card space-y-5 animate-in fade-in duration-150">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h4 className="text-base font-bold text-slate-900 dark:text-zinc-100">
            Nhật ký hoạt động & Lịch sử chỉnh sửa
          </h4>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
            {filteredLogs.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Action Filter Pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs">
            <button
              onClick={() => setFilterAction('ALL')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filterAction === 'ALL'
                  ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterAction('EXPENSE')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filterAction === 'EXPENSE'
                  ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              Chi tiêu
            </button>
            <button
              onClick={() => setFilterAction('SETTLEMENT')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filterAction === 'SETTLEMENT'
                  ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              Trả nợ
            </button>
            <button
              onClick={() => setFilterAction('MEMBER')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filterAction === 'MEMBER'
                  ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-300 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              Thành viên
            </button>
          </div>

          <button
            onClick={fetchActivities}
            disabled={loading}
            title="Làm mới nhật ký"
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Timeline items list */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 dark:text-emerald-400" />
          <p className="text-xs font-semibold">Đang tải nhật ký phòng...</p>
        </div>
      ) : filteredLogs.length > 0 ? (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const config = ACTION_CONFIG[log.action] || {
              label: log.action,
              icon: Clock,
              color: 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'
            };
            const Icon = config.icon;
            const hasMetadata =
              log.metadata &&
              Object.keys(log.metadata).length > 0 &&
              (log.metadata.old || log.metadata.new || log.metadata.reason);
            const isExpanded = expandedLogId === log._id;

            return (
              <div
                key={log._id}
                className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={log.actor?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=FairShare'}
                      alt={log.actor?.name}
                      className="w-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 object-cover ring-2 ring-slate-100 dark:ring-zinc-800 flex-shrink-0"
                    />

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                          {log.actor?.name || 'Hệ thống'}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${config.color}`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{config.label}</span>
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
                        {log.description}
                      </p>

                      <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                        {formatDateTime(log.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Metadata dropdown toggle */}
                  {hasMetadata && (
                    <button
                      type="button"
                      onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                      className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-400 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex-shrink-0"
                    >
                      <span>Đối chiếu</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Metadata Inspection Panel */}
                {hasMetadata && isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-800/60 -mx-3.5 -mb-3.5 sm:-mx-4 sm:-mb-4 p-3.5 sm:p-4 rounded-b-2xl text-xs space-y-2 animate-in fade-in duration-150">
                    <p className="font-bold text-slate-600 dark:text-zinc-400 uppercase text-[10px] tracking-wider">
                      Chi tiết thay đổi / Đối chiếu dữ liệu:
                    </p>

                    {log.metadata.old && log.metadata.new && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/60">
                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block uppercase">
                            Giá trị trước khi sửa:
                          </span>
                          <p className="font-semibold text-slate-800 dark:text-zinc-200">{log.metadata.old.title}</p>
                          <p className="font-extrabold text-slate-900 dark:text-zinc-100 num-vnd">
                            {formatVND(log.metadata.old.amount)}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/60">
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">
                            Giá trị sau khi sửa:
                          </span>
                          <p className="font-semibold text-slate-800 dark:text-zinc-200">{log.metadata.new.title}</p>
                          <p className="font-extrabold text-slate-900 dark:text-zinc-100 num-vnd">
                            {formatVND(log.metadata.new.amount)}
                          </p>
                        </div>
                      </div>
                    )}

                    {log.metadata.reason && (
                      <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block uppercase">
                          Lý do ghi nhận:
                        </span>
                        <p className="text-slate-700 dark:text-zinc-300 italic">{log.metadata.reason}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 px-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 mx-auto flex items-center justify-center mb-2">
            <History className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">Chưa có nhật ký hoạt động nào</p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Mọi thao tác tạo, sửa, xóa chi tiêu hoặc xác nhận trả nợ sẽ được lưu lại minh bạch tại đây.
          </p>
        </div>
      )}
    </div>
  );
}
