import React, { useState } from 'react';

const Input = ({ label, type = 'text', error, showPasswordToggle, fullWidth = true, className = '', icon, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className={`flex flex-col gap-1 ${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && <label className="text-sm font-medium text-gray-300">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
        <input
          type={inputType}
          className={`w-full h-10 rounded-lg border bg-slate-900 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-700'} ${icon ? 'pl-10' : ''} ${isPassword && showPasswordToggle ? 'pr-10' : ''}`}
          {...props}
        />
        {isPassword && showPasswordToggle && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-white"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};

export default Input;
