import React from 'react';
import Navbar from '../../components/common/Navbar';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Bảng điều khiển phòng trọ</h1>
        <p className="text-slate-600 mt-1">Xin chào {user?.name}, danh sách phòng của bạn đang được tải.</p>
      </main>
    </div>
  );
}
