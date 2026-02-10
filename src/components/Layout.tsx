import React from 'react';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  // 登录、注册、分享页面不需要容器布局
  const isAuthPage = location.pathname === '/login' ||
                     location.pathname === '/signup' ||
                     location.pathname === '/test' ||
                     location.pathname.startsWith('/share/');

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-2xl mx-auto bg-white min-h-screen shadow-xl">
        {children}
      </div>
    </div>
  );
};

export default Layout;
