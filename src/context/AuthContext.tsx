import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/supabase-auth';
import { supabase } from '../supabase';
import { UserProfile, LoginCredentials, SignupCredentials } from '../types';

interface User {
  uid: string;
  email?: string;
  phone?: string;
  loginType: 'email' | 'phone';
  displayName: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signup: (credentials: SignupCredentials) => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  setCurrentBook: (bookId: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查本地存储的登录状态
    const loadUser = async () => {
      console.log('🔐 AuthContext: 开始加载用户信息');
      try {
        const user = authService.getCurrentUser();
        console.log('🔐 AuthContext: 当前用户:', user ? (user.email || user.phone) : '未登录');
        if (user) {
          setCurrentUser(user);
          // 加载用户资料
          console.log('🔐 AuthContext: 开始加载用户资料');
          await loadUserProfile(user.uid);
          console.log('🔐 AuthContext: 用户资料加载完成');
        } else {
          console.log('🔐 AuthContext: 无登录用户，跳过资料加载');
        }
      } catch (error) {
        console.error('🔐 AuthContext: 加载用户错误:', error);
      } finally {
        console.log('🔐 AuthContext: 设置 loading = false');
        setLoading(false);
      }
    };

    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('uid', uid)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 是 "not found" 错误代码
        console.error('Load profile error:', error);
        return;
      }

      if (data) {
        setUserProfile({
          uid: data.uid,
          email: data.email,
          phone: data.phone,
          loginType: data.login_type || 'email',
          displayName: data.display_name,
          currentBookId: data.current_book_id,
          createdAt: new Date(data.created_at),
        } as UserProfile);
      } else {
        // 如果没有找到 profile，从 currentUser 创建一个
        console.log('User profile not found, creating from current user');
        const user = authService.getCurrentUser();
        if (user) {
          // 创建新的 user_profile
          const profileRecord: any = {
            uid: user.uid,
            display_name: user.displayName,
          };

          if (user.email) {
            profileRecord.email = user.email;
          }
          if (user.phone) {
            profileRecord.phone = user.phone;
          }

          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert([profileRecord]);

          if (insertError) {
            console.error('Error creating user profile:', insertError);
          } else {
            // 重新加载
            await loadUserProfile(uid);
          }
        }
      }
    } catch (error) {
      console.error('Load profile error:', error);
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    try {
      console.log('AuthContext: 开始注册流程');
      const user = await authService.signUp(credentials);
      console.log('AuthContext: 注册成功，用户信息:', user);
      setCurrentUser(user);
      await loadUserProfile(user.uid);
      console.log('AuthContext: 注册流程全部完成');
    } catch (error) {
      console.error('AuthContext: 注册失败', error);
      throw error;
    }
  };

  const login = async (credentials: LoginCredentials) => {
    const user = await authService.signIn(credentials);
    setCurrentUser(user);
    await loadUserProfile(user.uid);
  };

  const logout = async () => {
    await authService.signOut();
    setCurrentUser(null);
    setUserProfile(null);
  };

  const updateUserProfile = async (displayName: string) => {
    if (!currentUser || !userProfile) return;

    // 更新数据库
    await supabase
      .from('user_profiles')
      .update({ display_name: displayName })
      .eq('uid', currentUser.uid);

    const updatedProfile = { ...userProfile, displayName };
    setUserProfile(updatedProfile as UserProfile);

    // 更新localStorage
    const updatedUser = { ...currentUser, displayName };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
  };

  const setCurrentBook = async (bookId: string) => {
    if (!currentUser) return;

    console.log('AuthContext: setCurrentBook called with bookId:', bookId);
    console.log('AuthContext: Current userProfile:', userProfile);

    await supabase
      .from('user_profiles')
      .update({ current_book_id: bookId })
      .eq('uid', currentUser.uid);

    const updatedProfile = { ...userProfile!, currentBookId: bookId };
    console.log('AuthContext: Setting updated profile:', updatedProfile);
    setUserProfile(updatedProfile as UserProfile);
    console.log('AuthContext: userProfile updated');
  };

  const resetPassword = async (email: string) => {
    // Supabase暂不支持自定义密码重置
    console.log('密码重置功能暂未实现');
    throw new Error('密码重置功能暂未实现');
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    logout,
    updateUserProfile,
    setCurrentBook,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
