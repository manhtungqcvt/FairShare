import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { User, Mail, Lock, Eye, EyeOff, Sparkles, RefreshCw, ArrowRight } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarSeed, setAvatarSeed] = useState(`avatar_${Date.now()}`);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const currentAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || avatarSeed)}`;

  const handleRandomAvatar = () => {
    setAvatarSeed(`avatar_${Math.random().toString(36).substring(2, 9)}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !email.trim() || !password) {
      setErrorMsg('Vui lòng điền đầy đủ tất cả các trường');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có độ dài tối thiểu 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    const res = await register(name.trim(), email.trim(), password, currentAvatarUrl);
    setLoading(false);

    if (res.success) {
      navigate('/');
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/30 dark:from-zinc-950 dark:via-zinc-900/60 dark:to-emerald-950/20 transition-colors duration-200">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25 mb-4 transform hover:scale-105 transition-transform">
            <Sparkles className="w-7 h-7 text-emerald-100" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight">
            Tạo tài khoản <span className="text-emerald-600 dark:text-emerald-400">FairShare</span>
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
            Bắt đầu quản lý tài chính phòng trọ minh bạch và văn minh
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-card border border-slate-200/80 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-6">Đăng ký thành viên</h2>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-2.5 animate-in fade-in">
              <span className="font-semibold text-rose-900 dark:text-rose-200 flex-shrink-0">Lỗi:</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Avatar Preview */}
          <div className="flex items-center gap-4 p-3.5 mb-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60">
            <img
              src={currentAvatarUrl}
              alt="Avatar preview"
              className="w-14 h-14 rounded-full ring-2 ring-emerald-400 dark:ring-emerald-500 bg-white dark:bg-zinc-800 shadow-sm object-cover"
            />
            <div className="flex-1">
              <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">Ảnh đại diện ngẫu nhiên</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Tự động tạo theo phong cách hoạt hình</p>
            </div>
            <button
              type="button"
              onClick={handleRandomAvatar}
              title="Đổi avatar khác"
              className="p-2 rounded-xl text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Họ và tên"
              type="text"
              id="name"
              placeholder="Ví dụ: Nguyễn Văn A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={User}
              required
            />

            <Input
              label="Địa chỉ Email"
              type="email"
              id="email"
              placeholder="tenban@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              required
            />

            <Input
              label="Mật khẩu"
              type={showPassword ? 'text' : 'password'}
              id="password"
              placeholder="Tối thiểu 6 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              required
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
            />

            <Input
              label="Xác nhận mật khẩu"
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={Lock}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              icon={ArrowRight}
              className="mt-2"
            >
              Đăng ký tài khoản
            </Button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="mt-6 text-center text-sm text-slate-600 dark:text-zinc-400">
          Đã có tài khoản?{' '}
          <Link
            to="/login"
            className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline cursor-pointer"
          >
            Đăng nhập tại đây
          </Link>
        </p>
      </div>
    </div>
  );
}
