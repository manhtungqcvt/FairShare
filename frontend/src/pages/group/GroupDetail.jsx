import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Navbar from '../../components/common/Navbar';
import Button from '../../components/common/Button';
import BalanceSummaryBento from '../../components/group/BalanceSummaryBento';
import TransactionTimeline from '../../components/group/TransactionTimeline';
import ActivityFeed from '../../components/group/ActivityFeed';
import PendingSettlementsBanner from '../../components/settlements/PendingSettlementsBanner';
import AddExpenseModal from '../../components/expenses/AddExpenseModal';
import SettleUpModal from '../../components/settlements/SettleUpModal';
import {
  ArrowLeft,
  Users,
  Copy,
  Check,
  PlusCircle,
  HandCoins,
  RefreshCw,
  Sparkles,
  Shield,
  Share2,
  History,
  Calendar,
  LogOut,
  UserX,
  AlertTriangle
} from 'lucide-react';

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [group, setGroup] = useState(null);
  const [balancesData, setBalancesData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('TIMELINE'); // 'TIMELINE' | 'ACTIVITIES'
  const [memberActionLoading, setMemberActionLoading] = useState(false);

  // Modals state
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [settlePrefill, setSettlePrefill] = useState(null);

  const fetchGroupData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [groupRes, balancesRes, historyRes] = await Promise.all([
        api.get(`/groups/${id}`),
        api.get(`/groups/${id}/balances`),
        api.get(`/groups/${id}/history`)
      ]);

      if (groupRes.data.success) {
        setGroup(groupRes.data.group);
      }
      if (balancesRes.data.success) {
        setBalancesData(balancesRes.data.data);
      }
      if (historyRes.data.success) {
        setHistory(historyRes.data.history);
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu phòng:', error);
      if (error.response?.status === 403 || error.response?.status === 404) {
        showToast('Không có quyền truy cập hoặc phòng không tồn tại', 'error');
        navigate('/');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  const handleCopyCode = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenSettleWithPrefill = (prefillData = null) => {
    setSettlePrefill(prefillData);
    setSettleModalOpen(true);
  };

  // Xử lý rời nhóm hoặc xóa thành viên (Member Exit Lock)
  const handleRemoveOrLeaveMember = async (targetUserId, targetUserName, isSelf = false) => {
    const confirmMsg = isSelf
      ? 'Bạn có chắc chắn muốn rời khỏi nhóm này không?'
      : `Bạn có chắc chắn muốn xóa thành viên "${targetUserName}" khỏi nhóm không?`;

    if (!window.confirm(confirmMsg)) return;

    setMemberActionLoading(true);
    try {
      const res = await api.delete(`/groups/${id}/members/${targetUserId}`);
      if (res.data.success) {
        showToast(res.data.message || 'Thao tác thành công', 'success');
        if (isSelf) {
          navigate('/');
        } else {
          fetchGroupData(true);
        }
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Không thể thực hiện thao tác rời nhóm';
      showToast(errMsg, 'error');
    } finally {
      setMemberActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 dark:bg-zinc-950 flex flex-col transition-colors duration-200">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          <div className="h-6 w-32 bg-slate-200 dark:bg-zinc-800 rounded-md animate-pulse" />
          <div className="glass-card rounded-3xl p-6 sm:p-8 h-40 bg-slate-100 dark:bg-zinc-900 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass-card rounded-3xl p-6 h-48 bg-slate-100 dark:bg-zinc-900 animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!group) return null;

  const isAdmin = group.members?.some(
    (m) => m.user._id === user?._id && m.role === 'ADMIN'
  );

  // Lọc các khoản trả nợ đang chờ xác nhận
  const pendingSettlements = history.filter(
    (item) => item.itemType === 'SETTLEMENT' && item.status === 'PENDING'
  );

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-white transition-colors duration-200 pb-24 sm:pb-8">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-7">
        {/* Navigation Breadcrumb & Action bar */}
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer truncate"
          >
            <ArrowLeft className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Quay lại Bảng điều khiển</span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => fetchGroupData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-400 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Đồng bộ</span>
            </button>

            {/* Nút Rời phòng (áp dụng Member Exit Lock) */}
            <button
              onClick={() => handleRemoveOrLeaveMember(user?._id, user?.name, true)}
              disabled={memberActionLoading}
              title="Rời khỏi phòng (Yêu cầu tất toán công nợ trước)"
              className="flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Rời nhóm</span>
            </button>
          </div>
        </div>

        {/* KHU VỰC 1: BANNER CHỜ XÁC NHẬN THANH TOÁN 2 CHIỀU (PENDING SETTLEMENTS BANNER) */}
        {pendingSettlements.length > 0 && (
          <PendingSettlementsBanner
            pendingSettlements={pendingSettlements}
            currentUser={user}
            groupId={id}
            onActionComplete={() => fetchGroupData(true)}
          />
        )}

        {/* Group Header Banner */}
        <div className="glass-card rounded-3xl p-5 sm:p-8 border border-slate-200/90 dark:border-zinc-800 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6 relative overflow-hidden">
          {/* Decorative accent background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-100/40 via-teal-100/20 to-transparent dark:from-emerald-950/30 dark:via-teal-950/10 dark:to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-3 z-10 w-full lg:w-auto">
            <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight truncate max-w-full">
                {group.name}
              </h1>

              {/* Invite Code Chip with Instant Copy */}
              <button
                type="button"
                onClick={handleCopyCode}
                title="Bấm để sao chép mã mời"
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-mono font-bold tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>MÃ: {group.inviteCode}</span>
                {copied ? (
                  <span className="flex items-center gap-1 text-[11px] font-sans font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded-lg shadow-xs">
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Đã chép!
                  </span>
                ) : (
                  <Copy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                )}
              </button>
            </div>

            {group.description && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 max-w-2xl">{group.description}</p>
            )}

            {/* Member Stack & Management Chips */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <div className="flex items-center -space-x-2 mr-2">
                {group.members?.map((m) => (
                  <img
                    key={m.user._id}
                    src={m.user.avatar}
                    alt={m.user.name}
                    title={`${m.user.name} (${m.role === 'ADMIN' ? 'Trưởng phòng' : 'Thành viên'})`}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full ring-2 ring-white dark:ring-zinc-900 object-cover bg-slate-100 dark:bg-zinc-800"
                  />
                ))}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {group.members?.map((m) => {
                  const isCurrent = m.user._id === user?._id;
                  const canKick = isAdmin && !isCurrent;
                  return (
                    <span
                      key={m.user._id}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-medium border border-slate-200 dark:border-zinc-700 max-w-[150px] sm:max-w-none truncate"
                    >
                      <span className="truncate">{m.user.name}</span>
                      {m.role === 'ADMIN' && (
                        <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold">
                          Admin
                        </span>
                      )}
                      {canKick && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOrLeaveMember(m.user._id, m.user.name, false)}
                          title={`Xóa ${m.user.name} khỏi nhóm (Khóa nếu còn nợ)`}
                          className="text-slate-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 p-0.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <UserX className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Desktop/Tablet Action CTAs (Hidden on mobile because of Sticky Bottom Bar) */}
          <div className="hidden sm:flex flex-row items-center gap-3 z-10 flex-shrink-0">
            <Button
              variant="outline"
              icon={HandCoins}
              size="lg"
              onClick={() => handleOpenSettleWithPrefill()}
              className="bg-white dark:bg-zinc-900 dark:border-zinc-700 min-h-[44px]"
            >
              Trả tiền ngay (Settle Up)
            </Button>
            <Button
              variant="primary"
              icon={PlusCircle}
              size="lg"
              onClick={() => setExpenseModalOpen(true)}
              className="min-h-[44px]"
            >
              Thêm khoản chi
            </Button>
          </div>
        </div>

        {/* BENTO CARD: KHU VỰC ĐỐI SOÁT CÔNG NỢ (Rolling Net Balance) */}
        <section className="space-y-3">
          <BalanceSummaryBento
            balancesData={balancesData}
            currentUser={user}
            onOpenSettleUp={handleOpenSettleWithPrefill}
          />
        </section>

        {/* NAVIGATION TABS: BẢNG SAO KÊ vs NHẬT KÝ HOẠT ĐỘNG */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
              <button
                type="button"
                onClick={() => setActiveTab('TIMELINE')}
                className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[40px] sm:min-h-[44px] ${
                  activeTab === 'TIMELINE'
                    ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                    : 'bg-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Bảng sao kê giao dịch</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeTab === 'TIMELINE'
                      ? 'bg-slate-800 dark:bg-zinc-200 text-slate-200 dark:text-zinc-800'
                      : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  {history.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ACTIVITIES')}
                className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[40px] sm:min-h-[44px] ${
                  activeTab === 'ACTIVITIES'
                    ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                    : 'bg-transparent text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Nhật ký hoạt động</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Bảng sao kê giao dịch */}
          {activeTab === 'TIMELINE' && (
            <TransactionTimeline
              history={history}
              currentUser={user}
              isAdmin={isAdmin}
              onItemDeleted={() => fetchGroupData(true)}
            />
          )}

          {/* Tab 2: Nhật ký minh bạch (Audit Feed) */}
          {activeTab === 'ACTIVITIES' && (
            <ActivityFeed groupId={id} />
          )}
        </div>
      </main>

      {/* MOBILE STICKY BOTTOM ACTION BAR (HẠNG MỤC 2: THANH THAO TÁC NHANH Ở ĐÁY MÀN HÌNH) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800 p-2.5 sm:p-3 flex items-center gap-2.5 shadow-xl safe-area-pb">
        <button
          type="button"
          onClick={() => handleOpenSettleWithPrefill()}
          className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-bold shadow-xs active:scale-95 transition-transform cursor-pointer"
        >
          <HandCoins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Trả tiền</span>
        </button>
        <button
          type="button"
          onClick={() => setExpenseModalOpen(true)}
          className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-transform cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Thêm khoản chi</span>
        </button>
      </div>

      {/* Modal Thêm Khoản Chi */}
      <AddExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        group={group}
        currentUser={user}
        onExpenseCreated={() => fetchGroupData(true)}
      />

      {/* Modal Quyết toán nợ (Settle Up) */}
      <SettleUpModal
        isOpen={settleModalOpen}
        onClose={() => setSettleModalOpen(false)}
        group={group}
        currentUser={user}
        prefill={settlePrefill}
        onSettlementCreated={() => fetchGroupData(true)}
      />
    </div>
  );
}
