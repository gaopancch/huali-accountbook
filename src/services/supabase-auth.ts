import { supabase } from '../supabase';
import CryptoJS from 'crypto-js';

// 用户类型
export interface User {
  uid: string;
  email: string;
  displayName: string;
}

export const authService = {
  // 注册
  async signUp(email: string, password: string, displayName: string) {
    try {
      console.log('===== Supabase 注册流程开始 =====');
      console.log('1. 注册信息:', { email, displayName });

      // 生成唯一的uid
      const uid = CryptoJS.SHA256(email + Date.now()).toString();
      console.log('2. 生成 UID:', uid);

      // 密码哈希
      const passwordHash = CryptoJS.SHA256(password).toString();
      console.log('3. 密码已加密');

      // 检查用户是否存在
      console.log('4. 检查邮箱是否已注册...');
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (existingUser) {
        console.error('✗ 该邮箱已被注册');
        throw new Error('该邮箱已被注册,请直接登录');
      }

      console.log('✓ 邮箱可用');

      // 创建用户记录
      console.log('5. 创建用户记录...');
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert([
          {
            uid,
            email,
            password_hash: passwordHash,
            display_name: displayName,
          },
        ])
        .select()
        .single();

      if (userError) {
        console.error('✗ 创建用户失败:', userError);
        throw new Error('创建用户失败: ' + userError.message);
      }

      console.log('✓ 用户记录创建成功:', newUser);

      // 创建用户资料
      console.log('6. 创建用户资料...');
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([
          {
            uid,
            display_name: displayName,
          },
        ]);

      if (profileError) {
        console.error('⚠️ 创建用户资料失败:', profileError);
        // 不阻止注册流程
      } else {
        console.log('✓ 用户资料创建成功');
      }

      // 保存登录状态
      const currentUser: User = {
        uid,
        email,
        displayName,
      };
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      console.log('✓ 登录状态已保存');
      console.log('===== 注册成功 =====');

      return currentUser;
    } catch (error: any) {
      console.error('===== 注册失败 =====');
      console.error('错误:', error);
      throw error;
    }
  },

  // 登录
  async signIn(email: string, password: string) {
    try {
      console.log('===== Supabase 登录流程开始 =====');
      console.log('1. 尝试登录邮箱:', email);

      // 查找用户
      console.log('2. 查询用户信息...');
      const { data: user, error: queryError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (queryError || !user) {
        console.error('✗ 用户不存在');
        throw new Error('用户不存在,请先注册');
      }

      console.log('✓ 找到用户:', { uid: user.uid, email: user.email });

      // 验证密码
      console.log('3. 验证密码...');
      const passwordHash = CryptoJS.SHA256(password).toString();

      if (user.password_hash !== passwordHash) {
        console.error('✗ 密码错误');
        throw new Error('密码错误');
      }

      console.log('✓ 密码验证通过');

      // 保存登录状态
      const currentUser: User = {
        uid: user.uid,
        email: user.email,
        displayName: user.display_name,
      };
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      console.log('✓ 登录状态已保存');
      console.log('===== 登录成功 =====');

      return currentUser;
    } catch (error: any) {
      console.error('===== 登录失败 =====');
      console.error('错误:', error);
      throw error;
    }
  },

  // 登出
  async signOut() {
    localStorage.removeItem('currentUser');
    console.log('✓ 已登出');
  },

  // 获取当前用户
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },
};

export default authService;
