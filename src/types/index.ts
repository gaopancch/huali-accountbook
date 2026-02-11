// 数据类型定义

// 账本类型
export interface Book {
  id: string;
  name: string;
  ownerId: string;      // 原始创建者ID（用于显示创建者信息）
  ownerName: string;    // 原始创建者名称
  members: string[];    // 所有有权限的用户ID数组（包括创建者和共享用户）
  isDefault: boolean;
  sharedWith?: string[]; // 已废弃，保留用于兼容旧数据
  incomeCategories: string[];
  expenseCategories: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 记录类型
export interface Record {
  id: string;
  bookId: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  remark: string;
  date: string; // YYYY-MM-DD format
  createdAt: Date;
  updatedAt: Date;
}

// 共享关系类型
export interface SharedBook {
  id: string;
  bookId: string;
  ownerId: string;
  ownerName: string;
  userId: string;
  userName: string;
  permission: 'read' | 'write';
  status: 'pending' | 'accepted';
  createdAt: Date;
  updatedAt: Date;
}

// 分享链接类型
export interface ShareLink {
  id: string;
  bookId: string;
  ownerId: string;
  permission: 'read' | 'write';
  createdAt: Date;
  expireAt?: Date;
}

// 密码本类型
export interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 用户信息类型
export interface UserProfile {
  uid: string;
  email?: string;
  phone?: string;
  loginType: 'email' | 'phone';
  displayName: string;
  currentBookId?: string; // 当前选中的账本ID
  createdAt: Date;
}

// 登录凭证类型
export type LoginCredentials =
  | { type: 'email'; email: string; password: string }
  | { type: 'phone'; phone: string; password: string };

// 注册凭证类型
export type SignupCredentials =
  | { type: 'email'; email: string; password: string; displayName: string }
  | { type: 'phone'; phone: string; password: string; displayName: string };

// 默认分类
export const DEFAULT_INCOME_CATEGORIES = ['工资', '奖金', '理财收益', '其他收入'];
export const DEFAULT_EXPENSE_CATEGORIES = ['餐饮', '购物', '交通', '娱乐', '住房', '医疗', '教育', '其他支出'];
