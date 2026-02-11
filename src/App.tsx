import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import AddRecord from './pages/AddRecord';
import Statistics from './pages/Statistics';
import Profile from './pages/Profile';
import ShareBook from './pages/ShareBook';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  console.log('🛡️ ProtectedRoute: loading =', loading, ', currentUser =', currentUser ? currentUser.email : 'null');

  if (loading) {
    console.log('🛡️ ProtectedRoute: 显示加载中...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  if (!currentUser) {
    console.log('🛡️ ProtectedRoute: 未登录，重定向到 /login');
  } else {
    console.log('🛡️ ProtectedRoute: 已登录，渲染受保护内容');
  }

  return currentUser ? <>{children}</> : <Navigate to="/login" />;
};

// Public Route (redirect to home if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  console.log('🔓 PublicRoute: loading =', loading, ', currentUser =', currentUser ? currentUser.email : 'null');

  if (loading) {
    console.log('🔓 PublicRoute: 显示加载中...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  if (currentUser) {
    console.log('🔓 PublicRoute: 已登录，重定向到首页');
  } else {
    console.log('🔓 PublicRoute: 未登录，显示公开页面');
  }

  return currentUser ? <Navigate to="/" /> : <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-record"
        element={
          <ProtectedRoute>
            <AddRecord />
          </ProtectedRoute>
        }
      />
      <Route
        path="/statistics"
        element={
          <ProtectedRoute>
            <Statistics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Share Book - Public route (accessible to everyone) */}
      <Route path="/share/:bookId" element={<ShareBook />} />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <AppRoutes />
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;
