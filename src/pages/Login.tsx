import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthMethodSwitch from '../components/AuthMethodSwitch';
import type { LoginCredentials } from '../types';

const Login: React.FC = () => {
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authMethod === 'email' && !email) {
      setError('请填写邮箱');
      return;
    }

    if (authMethod === 'phone' && !phone) {
      setError('请填写手机号');
      return;
    }

    if (!password) {
      setError('请填写密码');
      return;
    }

    try {
      setError('');
      setLoading(true);

      const credentials: LoginCredentials = authMethod === 'email'
        ? { type: 'email', email, password }
        : { type: 'phone', phone, password };

      await login(credentials);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError('登录失败: ' + (err.message || `请检查${authMethod === 'email' ? '邮箱' : '手机号'}和密码`));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-blue-500 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">记账宝</h1>
        <h2 className="text-xl font-semibold text-center text-gray-600 mb-6">登录</h2>

        <AuthMethodSwitch method={authMethod} onChange={setAuthMethod} />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" style={{ whiteSpace: 'pre-line' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {authMethod === 'email' ? (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                邮箱
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                手机号
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={11}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="18888888888"
              />
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/forgot-password" className="text-sm text-gray-600 hover:text-primary hover:underline">
            忘记密码？
          </Link>
        </div>

        <p className="mt-4 text-center text-gray-600">
          还没有账号?{' '}
          <Link to="/signup" className="text-primary hover:underline font-semibold">
            立即注册
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
