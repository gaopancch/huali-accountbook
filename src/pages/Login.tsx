import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('请填写所有字段');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);

      // 更详细的错误提示
      let errorMessage = '登录失败: ';

      switch (err.code) {
        case 'auth/network-request-failed':
          errorMessage += '网络连接失败。请检查您的网络连接，或尝试切换WiFi/移动数据。如果问题持续，可能是网络环境限制了Firebase访问。';
          break;
        case 'auth/invalid-email':
          errorMessage += '邮箱格式不正确';
          break;
        case 'auth/user-disabled':
          errorMessage += '该账号已被禁用';
          break;
        case 'auth/user-not-found':
          errorMessage += '账号不存在';
          break;
        case 'auth/wrong-password':
          errorMessage += '密码错误';
          break;
        case 'auth/invalid-credential':
          errorMessage += '邮箱或密码错误';
          break;
        case 'auth/too-many-requests':
          errorMessage += '登录尝试次数过多，请稍后再试';
          break;
        default:
          errorMessage += err.message || '未知错误，请稍后重试';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail || !resetEmail.includes('@')) {
      setResetMessage('请输入有效的邮箱地址');
      return;
    }

    try {
      setResetLoading(true);
      setResetMessage('');
      await resetPassword(resetEmail);
      setResetMessage('密码重置邮件已发送! 请检查您的邮箱并点击链接重置密码。');
      setTimeout(() => {
        setShowResetModal(false);
        setResetEmail('');
        setResetMessage('');
      }, 3000);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setResetMessage('该邮箱未注册');
      } else {
        setResetMessage('发送失败: ' + (err.message || '请稍后重试'));
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-blue-500 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">记账宝</h1>
        <h2 className="text-xl font-semibold text-center text-gray-600 mb-6">登录</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
          <button
            onClick={() => setShowResetModal(true)}
            className="text-primary hover:underline text-sm"
          >
            忘记密码?
          </button>
        </div>

        <p className="mt-6 text-center text-gray-600">
          还没有账号?{' '}
          <Link to="/signup" className="text-primary hover:underline font-semibold">
            立即注册
          </Link>
        </p>
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">找回密码</h3>
            <p className="text-sm text-gray-600 mb-4">
              输入您的注册邮箱，我们将发送密码重置链接到您的邮箱。
            </p>

            {resetMessage && (
              <div className={`px-4 py-3 rounded mb-4 ${
                resetMessage.includes('已发送')
                  ? 'bg-green-100 border border-green-400 text-green-700'
                  : 'bg-red-100 border border-red-400 text-red-700'
              }`}>
                {resetMessage}
              </div>
            )}

            <form onSubmit={handleResetPassword}>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                placeholder="your@email.com"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false);
                    setResetEmail('');
                    setResetMessage('');
                  }}
                  className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  {resetLoading ? '发送中...' : '发送重置链接'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
