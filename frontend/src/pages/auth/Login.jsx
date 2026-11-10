import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);

    if (res.success) {
      navigate(from, { replace: true });
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/30">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25 mb-4 transform hover:scale-105 transition-transform">
            <Sparkles className="w-7 h-7 text-emerald-100" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Chào mừng đến với <span className="text-emerald-600">FairShare</span>
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Minh bạch chi tiêu & công nợ phòng trọ, nhóm bạn
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-card border border-slate-200/80">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Đăng nhập tài khoản</h2>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5 animate-in fade-in">
              <span className="font-semibold text-rose-900 flex-shrink-0">Lỗi:</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Nhập mật khẩu của bạn"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              required
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
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
              Đăng nhập ngay
            </Button>
          </form>

          {/* Quick Demo Info */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Bạn mới tham gia FairShare?</span>
              </div>
              <p className="text-slate-500">
                Đăng ký tài khoản mới chỉ mất 10 giây để tạo hoặc tham gia phòng trọ của bạn!
              </p>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="mt-6 text-center text-sm text-slate-600">
          Chưa có tài khoản?{' '}
          <Link
            to="/register"
            className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
          >
            Đăng ký tài khoản mới
          </Link>
        </p>
      </div>
    </div>
  );
}
