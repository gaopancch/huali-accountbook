import { supabase } from '../supabase';
import CryptoJS from 'crypto-js';
import { isValidEmail, isValidPhone, formatPhone } from '../utils/validators';
import type { LoginCredentials, SignupCredentials } from '../types';

// 用户类型
export interface User {
  uid: string;
  email?: string;
  phone?: string;
  loginType: 'email' | 'phone';
  displayName: string;
}

export const authService = {
  // 注册
  async signUp(credentials: SignupCredentials) {
    try {
      console.log('===== Supabase 注册流程开始 =====');

      const { type, password, displayName } = credentials;
      let identifier: string;
      let identifierField: string;

      // 验证输入格式
      if (type === 'email') {
        const { email } = credentials;
        if (!isValidEmail(email)) {
          throw new Error('邮箱格式不正确');
        }
        identifier = email;
        identifierField = 'email';
        console.log('1. 注册信息:', { email, displayName, type: 'email' });
      } else {
        const { phone } = credentials;
        const formattedPhone = formatPhone(phone);
        if (!isValidPhone(formattedPhone)) {
          throw new Error('手机号格式不正确');
        }
        identifier = formattedPhone;
        identifierField = 'phone';
        console.log('1. 注册信息:', { phone: formattedPhone, displayName, type: 'phone' });
      }

      // 生成唯一的uid
      const uid = CryptoJS.SHA256(identifier + Date.now()).toString();
      console.log('2. 生成 UID:', uid);

      // 密码哈希
      const passwordHash = CryptoJS.SHA256(password).toString();
      console.log('3. 密码已加密');

      // 检查用户是否存在
      console.log(`4. 检查${type === 'email' ? '邮箱' : '手机号'}是否已注册...`);
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq(identifierField, identifier)
        .single();

      if (existingUser) {
        console.error(`✗ 该${type === 'email' ? '邮箱' : '手机号'}已被注册`);
        throw new Error(`该${type === 'email' ? '邮箱' : '手机号'}已被注册,请直接登录`);
      }

      console.log(`✓ ${type === 'email' ? '邮箱' : '手机号'}可用`);

      // 创建用户记录
      console.log('5. 创建用户记录...');
      const userRecord: any = {
        uid,
        password_hash: passwordHash,
        display_name: displayName,
        login_type: type,
      };

      if (type === 'email') {
        userRecord.email = identifier;
      } else {
        userRecord.phone = identifier;
      }

      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert([userRecord])
        .select()
        .single();

      if (userError) {
        console.error('✗ 创建用户失败:', userError);
        throw new Error('创建用户失败: ' + userError.message);
      }

      console.log('✓ 用户记录创建成功:', newUser);

      // 创建用户资料
      console.log('6. 创建用户资料...');
      const profileRecord: any = {
        uid,
        display_name: displayName,
      };

      if (type === 'email') {
        profileRecord.email = identifier;
      } else {
        profileRecord.phone = identifier;
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([profileRecord]);

      if (profileError) {
        console.error('⚠️ 创建用户资料失败:', profileError);
        // 不阻止注册流程
      } else {
        console.log('✓ 用户资料创建成功');
      }

      // 保存登录状态
      const currentUser: User = {
        uid,
        displayName,
        loginType: type,
        ...(type === 'email' ? { email: identifier } : { phone: identifier }),
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
  async signIn(credentials: LoginCredentials) {
    try {
      console.log('===== Supabase 登录流程开始 =====');

      const { type, password } = credentials;
      let identifier: string;
      let identifierField: string;

      // 验证输入格式
      if (type === 'email') {
        const { email } = credentials;
        if (!isValidEmail(email)) {
          throw new Error('邮箱格式不正确');
        }
        identifier = email;
        identifierField = 'email';
        console.log('1. 尝试登录邮箱:', email);
      } else {
        const { phone } = credentials;
        const formattedPhone = formatPhone(phone);
        if (!isValidPhone(formattedPhone)) {
          throw new Error('手机号格式不正确');
        }
        identifier = formattedPhone;
        identifierField = 'phone';
        console.log('1. 尝试登录手机号:', formattedPhone);
      }

      // 查找用户
      console.log('2. 查询用户信息...');
      const { data: user, error: queryError } = await supabase
        .from('users')
        .select('*')
        .eq(identifierField, identifier)
        .single();

      if (queryError || !user) {
        console.error('✗ 用户不存在');
        throw new Error('用户不存在,请先注册');
      }

      console.log('✓ 找到用户:', { uid: user.uid, [identifierField]: identifier });

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
        displayName: user.display_name,
        loginType: type,
        ...(type === 'email' ? { email: user.email } : { phone: user.phone }),
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
