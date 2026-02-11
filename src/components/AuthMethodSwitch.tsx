import React from 'react';

interface AuthMethodSwitchProps {
  method: 'email' | 'phone';
  onChange: (method: 'email' | 'phone') => void;
}

export default function AuthMethodSwitch({ method, onChange }: AuthMethodSwitchProps) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
      <button
        type="button"
        onClick={() => onChange('email')}
        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
          method === 'email'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        邮箱登录
      </button>
      <button
        type="button"
        onClick={() => onChange('phone')}
        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
          method === 'phone'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        手机号登录
      </button>
    </div>
  );
}
