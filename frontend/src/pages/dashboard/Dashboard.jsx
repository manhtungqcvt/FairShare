import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import Button from '../../components/common/Button';
import GroupCard from '../../components/groups/GroupCard';
import CreateGroupModal from '../../components/groups/CreateGroupModal';
import JoinGroupModal from '../../components/groups/JoinGroupModal';
import { formatVND } from '../../utils/format';
import {
  PlusCircle,
  KeyRound,
  Home,
  Wallet,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Users,
  Search,
  RefreshCw
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get('/groups');
      if (res.data.success) {
        setGroups(res.data.groups || []);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách nhóm:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Tính tổng số dư nợ của user trên tất cả các phòng
  const totalNetBalance = groups.reduce((acc, g) => acc + (Number(g.myBalance) || 0), 0);
  const isOverallPositive = totalNetBalance > 0;
  const isOverallNegative = totalNetBalance < 0;

  // Lọc nhóm theo từ khóa tìm kiếm
  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.inviteCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome & Quick Actions Hero */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
                Xin chào, {user?.name}! 👋
              </h1>
            </div>
            <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1">
              Theo dõi và quản lý dòng tiền chi tiêu chung của phòng trọ & bạn bè một cách rõ ràng nhất.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              icon={KeyRound}
              onClick={() => setJoinModalOpen(true)}
              className="bg-white dark:bg-zinc-900 dark:border-zinc-700"
            >
              Nhập mã mời
            </Button>
            <Button
              variant="primary"
              icon={PlusCircle}
              onClick={() => setCreateModalOpen(true)}
            >
              Tạo phòng mới
            </Button>
          </div>
        </div>

        {/* Bento Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Số phòng đang tham gia */}
          <div className="glass-card rounded-3xl p-5 border border-slate-200/90 dark:border-zinc-800 shadow-card flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center p-3.5 flex-shrink-0">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 dark:text-zinc-500 tracking-wider">
                Phòng trọ & Nhóm
              </p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100 mt-0.5 num-vnd">
                {groups.length} <span className="text-sm font-medium text-slate-500 dark:text-zinc-400">phòng</span>
              </p>
            </div>
          </div>

          {/* Card 2: Tổng số dư ròng cá nhân */}
          <div className="glass-card rounded-3xl p-5 border border-slate-200/90 dark:border-zinc-800 shadow-card flex items-center gap-4">
            <div
              className={`w-13 h-13 rounded-2xl flex items-center justify-center p-3.5 flex-shrink-0 ${
                isOverallPositive
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : isOverallNegative
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
              }`}
            >
              {isOverallPositive ? (
                <TrendingUp className="w-6 h-6" />
              ) : isOverallNegative ? (
                <TrendingDown className="w-6 h-6" />
              ) : (
                <Wallet className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 dark:text-zinc-500 tracking-wider">
                Tổng số dư nợ ròng
              </p>
              <p
                className={`text-2xl font-extrabold mt-0.5 num-vnd ${
                  isOverallPositive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isOverallNegative
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-800 dark:text-zinc-100'
                }`}
              >
                {isOverallPositive && '+'}
                {formatVND(totalNetBalance)}
              </p>
            </div>
          </div>

          {/* Card 3: Trạng thái đối soát */}
          <div className="glass-card rounded-3xl p-5 border border-slate-200/90 dark:border-zinc-800 shadow-card flex items-center gap-4 sm:col-span-2 lg:col-span-1">
            <div className="w-13 h-13 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center p-3.5 flex-shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 dark:text-zinc-500 tracking-wider">
                Trạng thái tài chính
              </p>
              <p className="text-sm font-bold text-slate-800 dark:text-zinc-200 mt-1">
                {isOverallPositive
                  ? 'Bạn đang là chủ nợ (được nhận lại)'
                  : isOverallNegative
                  ? 'Bạn cần hoàn trả các khoản nợ'
                  : 'Công nợ của bạn đã cân bằng hoàn toàn'}
              </p>
            </div>
          </div>
        </div>

        {/* Groups Section Header */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">Danh sách phòng của bạn</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                {filteredGroups.length}
              </span>
            </div>

            {/* Search & Refresh */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm tên phòng hoặc mã..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-950/60 focus:border-emerald-500"
                />
              </div>
              <button
                onClick={fetchGroups}
                disabled={loading}
                title="Làm mới"
                className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Group Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="glass-card rounded-3xl p-6 h-56 animate-pulse bg-slate-100 dark:bg-zinc-900 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="h-5 bg-slate-200 dark:bg-zinc-800 rounded-md w-2/3" />
                    <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded-md w-1/2" />
                  </div>
                  <div className="h-8 bg-slate-200 dark:bg-zinc-800 rounded-xl w-full" />
                </div>
              ))}
            </div>
          ) : filteredGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => (
                <GroupCard key={group._id} group={group} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="glass-card rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto border-2 border-dashed border-slate-200 dark:border-zinc-800">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
                <Home className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-1">
                {searchQuery ? 'Không tìm thấy phòng phù hợp' : 'Bạn chưa tham gia phòng nào'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6 max-w-sm mx-auto">
                {searchQuery
                  ? 'Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc tìm kiếm.'
                  : 'Hãy tạo phòng trọ mới cho nhóm bạn, hoặc nhập mã mời 6 ký tự để tham gia phòng cùng bạn bè ngay!'}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  variant="primary"
                  icon={PlusCircle}
                  onClick={() => setCreateModalOpen(true)}
                >
                  Tạo phòng mới
                </Button>
                <Button
                  variant="outline"
                  icon={KeyRound}
                  onClick={() => setJoinModalOpen(true)}
                  className="bg-white dark:bg-zinc-900 dark:border-zinc-700"
                >
                  Nhập mã mời
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <CreateGroupModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onGroupCreated={() => fetchGroups()}
      />

      <JoinGroupModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onGroupJoined={() => fetchGroups()}
      />
    </div>
  );
}
