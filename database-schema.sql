-- 记账宝数据库架构
-- Supabase PostgreSQL 数据库表结构
-- 版本: 1.0.0

-- ============================================
-- 启用 UUID 扩展
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 用户认证表 (users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  login_type TEXT CHECK (login_type IN ('email', 'phone')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT users_email_or_phone_required CHECK ((email IS NOT NULL) OR (phone IS NOT NULL))
);

COMMENT ON TABLE users IS '用户认证信息表';
COMMENT ON COLUMN users.uid IS '用户唯一标识符';
COMMENT ON COLUMN users.email IS '用户邮箱（可选）';
COMMENT ON COLUMN users.phone IS '用户手机号（可选）';
COMMENT ON COLUMN users.password_hash IS 'SHA256 加密的密码哈希';
COMMENT ON COLUMN users.display_name IS '用户显示名称';
COMMENT ON COLUMN users.login_type IS '登录方式: email 或 phone';

-- ============================================
-- 2. 用户资料表 (user_profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uid TEXT UNIQUE NOT NULL,
  email TEXT,
  phone TEXT,
  display_name TEXT NOT NULL,
  current_book_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE user_profiles IS '用户资料信息表';
COMMENT ON COLUMN user_profiles.email IS '用户邮箱（可选）';
COMMENT ON COLUMN user_profiles.phone IS '用户手机号（可选）';
COMMENT ON COLUMN user_profiles.current_book_id IS '当前选中的账本ID';

-- ============================================
-- 3. 账本表 (books)
-- ============================================
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  members TEXT[] DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  income_categories TEXT[] DEFAULT '{"工资", "奖金", "理财收益", "其他收入"}',
  expense_categories TEXT[] DEFAULT '{"餐饮", "购物", "交通", "娱乐", "住房", "医疗", "教育", "其他支出"}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE books IS '账本信息表';
COMMENT ON COLUMN books.owner_id IS '账本所有者ID';
COMMENT ON COLUMN books.owner_name IS '账本所有者名称';
COMMENT ON COLUMN books.members IS '有权访问该账本的用户ID数组';
COMMENT ON COLUMN books.is_default IS '是否为默认账本';
COMMENT ON COLUMN books.income_categories IS '收入分类数组';
COMMENT ON COLUMN books.expense_categories IS '支出分类数组';

-- ============================================
-- 4. 记账记录表 (records)
-- ============================================
CREATE TABLE IF NOT EXISTS records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  remark TEXT,
  date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE records IS '记账记录表';
COMMENT ON COLUMN records.book_id IS '所属账本ID';
COMMENT ON COLUMN records.type IS '记录类型: income(收入) 或 expense(支出)';
COMMENT ON COLUMN records.category IS '记录分类';
COMMENT ON COLUMN records.amount IS '金额(保留两位小数)';
COMMENT ON COLUMN records.remark IS '备注信息';
COMMENT ON COLUMN records.date IS '记录日期 (YYYY-MM-DD格式)';

-- ============================================
-- 创建索引以提高查询性能
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_uid ON users(uid);
CREATE INDEX IF NOT EXISTS idx_user_profiles_uid ON user_profiles(uid);
CREATE INDEX IF NOT EXISTS idx_books_owner_id ON books(owner_id);
CREATE INDEX IF NOT EXISTS idx_books_members ON books USING GIN(members);
CREATE INDEX IF NOT EXISTS idx_records_book_id ON records(book_id);
CREATE INDEX IF NOT EXISTS idx_records_date ON records(date);
CREATE INDEX IF NOT EXISTS idx_records_type ON records(type);

-- ============================================
-- 启用行级安全 (Row Level Security)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 清理旧策略 (如果存在)
-- ============================================
DROP POLICY IF EXISTS "Allow all" ON users;
DROP POLICY IF EXISTS "Allow all" ON user_profiles;
DROP POLICY IF EXISTS "Allow all" ON books;
DROP POLICY IF EXISTS "Allow all" ON records;

-- ============================================
-- 创建安全策略
-- ============================================
-- 注意: 当前使用宽松的策略允许所有操作
-- 在生产环境中，建议实施更细粒度的权限控制

CREATE POLICY "Allow all on users"
  ON users FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all on user_profiles"
  ON user_profiles FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all on books"
  ON books FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all on records"
  ON records FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 创建自动更新时间戳的触发器函数
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- 为需要的表添加触发器
-- ============================================
DROP TRIGGER IF EXISTS update_books_updated_at ON books;
CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_records_updated_at ON records;
CREATE TRIGGER update_records_updated_at
    BEFORE UPDATE ON records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 验证表创建
-- ============================================
-- 执行后可以运行以下查询验证:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
