import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LogOut, Home, User, ChevronDown, Sparkles, Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Đóng dropdown khi bấm ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="glass-header sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-all duration-200 group-hover:scale-105">
              <Sparkles className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 dark:from-emerald-400 dark:via-teal-300 dark:to-zinc-100 bg-clip-text text-transparent">
                FairShare
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                Phòng trọ văn minh
              </span>
            </div>
          </Link>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
              aria-label={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
              className="p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700 transition-transform duration-300 -rotate-12 hover:rotate-0" />
              )}
            </button>

            {/* User Nav */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2 sm:pl-3 rounded-full hover:bg-slate-100/80 dark:hover:bg-zinc-800/80 border border-transparent hover:border-slate-200 dark:hover:border-zinc-700 transition-all cursor-pointer select-none"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100 leading-tight">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 truncate max-w-[150px]">
                      {user.email}
                    </p>
                  </div>
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                    alt={user.name}
                    className="w-9 h-9 rounded-full ring-2 ring-emerald-500/40 bg-slate-100 dark:bg-zinc-800 object-cover"
                  />
                  <ChevronDown className="w-4 h-4 text-slate-400 dark:text-zinc-500 mr-1" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-slate-100 dark:border-zinc-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-zinc-800 sm:hidden">
                      <p className="text-sm font-semibold text-slate-800 dark:text-zinc-100">{user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      <Home className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                      <span>Danh sách phòng trọ</span>
                    </Link>

                    <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer px-3 py-1.5"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 sm:px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
