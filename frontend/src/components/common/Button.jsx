import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  fullWidth = false,
  className = '',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer select-none';

  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow focus:ring-emerald-500 disabled:bg-emerald-300',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 focus:ring-slate-400 disabled:bg-slate-50 disabled:text-slate-400',
    outline: 'border border-slate-300 hover:bg-slate-50 text-slate-700 focus:ring-slate-400 disabled:opacity-50',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500 disabled:bg-rose-300',
    ghost: 'hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus:ring-slate-300',
    emeraldSubtle: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 focus:ring-emerald-400'
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5'
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'cursor-not-allowed opacity-70 pointer-events-none' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 flex-shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
