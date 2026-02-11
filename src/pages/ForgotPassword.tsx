import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { isValidEmail, isValidPhone, formatPhone } from '../utils/validators';
import CryptoJS from 'crypto-js';

const ForgotPassword: React.FC = () => {
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setTempPassword('');

    if (!identifier) {
      setError(`请输入${method === 'email' ? '邮箱' : '手机号'}`);
      return;
    }

    // 验证格式
    if (method === 'email') {
      if (!isValidEmail(identifier)) {
        setError('邮箱格式不正确');
        return;
      }
    } else {
      const formattedPhone = formatPhone(identifier);
      if (!isValidPhone(formattedPhone)) {
        setError('手机号格式不正确');
        return;
      }
    }

    try {
      setLoading(true);

      // 查找用户
      const field = method === 'email' ? 'email' : 'phone';
      const value = method === 'email' ? identifier : formatPhone(identifier);

      const { data: user, error: queryError } = await supabase
        .from('users')
        .select('*')
        .eq(field, value)
        .single();

      if (queryError || !user) {
        setError(`该${method === 'email' ? '邮箱' : '手机号'}未注册`);
        return;
      }

      // 生成临时密码
      const newPassword = generateTempPassword();
      const passwordHash = CryptoJS.SHA256(newPassword).toString();

      // 更新密码
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('uid', user.uid);

      if (updateError) throw updateError;

      // 在实际生产环境中，这里应该调用邮件/短信服务
      // 目前是演示环境，直接显示临时密码
      setTempPassword(newPassword);

      if (method === 'email') {
        setSuccess(`密码重置成功！临时密码已生成（生产环境将发送到您的邮箱）。`);
      } else {
        setSuccess(`密码重置成功！临时密码已生成（生产环境将发送短信到您的手机）。`);
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      setError('重置密码失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-blue-500 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">找回密码</h1>
        <p className="text-center text-gray-600 mb-6">输入您的账号信息以重置密码</p>

        {/* 切换方式 */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            type="button"
            onClick={() => {
              setMethod('email');
              setIdentifier('');
              setError('');
              setSuccess('');
              setTempPassword('');
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              method === 'email'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            邮箱找回
          </button>
          <button
            type="button"
            onClick={() => {
              setMethod('phone');
              setIdentifier('');
              setError('');
              setSuccess('');
              setTempPassword('');
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              method === 'phone'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            手机找回
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="font-semibold">{success}</p>
            {tempPassword && (
              <div className="mt-3 p-3 bg-white rounded border border-green-300">
                <p className="text-sm mb-2">您的临时密码：</p>
                <p className="text-2xl font-mono font-bold text-center text-blue-600 select-all">
                  {tempPassword}
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  请复制此密码登录后立即修改密码
                </p>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {method === 'email' ? (
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                邮箱地址
              </label>
              <input
                type="email"
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                手机号
              </label>
              <input
                type="tel"
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                maxLength={11}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="18888888888"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '处理中...' : '重置密码'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Link to="/login" className="block text-primary hover:underline font-semibold">
            返回登录
          </Link>
          <Link to="/signup" className="block text-gray-600 hover:underline">
            还没有账号？立即注册
          </Link>
        </div>

        {tempPassword && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>演示说明：</strong>在生产环境中，临时密码将通过邮件或短信发送，不会在页面上显示。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
