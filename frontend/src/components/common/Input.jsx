import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  icon: Icon,
  rightElement,
  disabled = false,
  required = false,
  className = '',
  inputClassName = '',
  ...props
}, ref) => {
  const inputId = id || props.name;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative rounded-xl shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-5 h-5" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            w-full rounded-xl border bg-white text-slate-900 text-sm transition-all duration-200
            placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0
            ${Icon ? 'pl-10' : 'pl-3.5'}
            ${rightElement ? 'pr-11' : 'pr-3.5'}
            py-2.5
            ${error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
              : 'border-slate-300 hover:border-slate-400 focus:border-emerald-500 focus:ring-emerald-200'
            }
            ${disabled ? 'bg-slate-50 cursor-not-allowed opacity-75' : ''}
            ${inputClassName}
          `}
          {...props}
        />

        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
