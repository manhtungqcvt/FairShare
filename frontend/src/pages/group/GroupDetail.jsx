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
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="h-6 w-32 bg-slate-200 rounded-md animate-pulse" />
          <div className="glass-card rounded-3xl p-8 h-40 bg-slate-100 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass-card rounded-3xl p-6 h-48 bg-slate-100 animate-pulse" />
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
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
        {/* Navigation Breadcrumb & Action bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Bảng điều khiển</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchGroupData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Đồng bộ</span>
            </button>

            {/* Nút Rời phòng (áp dụng Member Exit Lock) */}
            <button
              onClick={() => handleRemoveOrLeaveMember(user?._id, user?.name, true)}
              disabled={memberActionLoading}
              title="Rời khỏi phòng (Yêu cầu tất toán công nợ trước)"
              className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-rose-600 p-1.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
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
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
          {/* Decorative accent background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-100/40 via-teal-100/20 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-3 z-10">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {group.name}
              </h1>

              {/* Invite Code Chip with Instant Copy */}
              <button
                type="button"
                onClick={handleCopyCode}
                title="Bấm để sao chép mã mời"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>MÃ: {group.inviteCode}</span>
                {copied ? (
                  <span className="flex items-center gap-1 text-[11px] font-sans font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-lg shadow-xs">
                    <Check className="w-3 h-3 text-emerald-600" />
                    Đã sao chép!
                  </span>
                ) : (
                  <Copy className="w-3.5 h-3.5 text-emerald-600" />
                )}
              </button>
            </div>

            {group.description && (
              <p className="text-sm text-slate-600 max-w-2xl">{group.description}</p>
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
                    className="w-8 h-8 rounded-full ring-2 ring-white object-cover bg-slate-100"
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
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-medium border border-slate-200"
                    >
                      <span>{m.user.name}</span>
                      {m.role === 'ADMIN' && (
                        <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                          Admin
                        </span>
                      )}
                      {canKick && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOrLeaveMember(m.user._id, m.user.name, false)}
                          title={`Xóa ${m.user.name} khỏi nhóm (Khóa nếu còn nợ)`}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
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

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 z-10 flex-shrink-0">
            <Button
              variant="outline"
              icon={HandCoins}
              size="lg"
              onClick={() => handleOpenSettleWithPrefill()}
              className="bg-white"
            >
              Trả tiền ngay (Settle Up)
            </Button>
            <Button
              variant="primary"
              icon={PlusCircle}
              size="lg"
              onClick={() => setExpenseModalOpen(true)}
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
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('TIMELINE')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'TIMELINE'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Bảng sao kê giao dịch</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeTab === 'TIMELINE' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {history.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ACTIVITIES')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'ACTIVITIES'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Nhật ký hoạt động (Audit Log)</span>
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
