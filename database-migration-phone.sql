-- 数据库迁移：添加手机号登录功能
-- 执行前请先备份users和user_profiles表

-- 1. 修改users表
-- 添加phone字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE;

-- 添加login_type字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_type TEXT CHECK (login_type IN ('email', 'phone'));

-- 将email字段改为可选
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;

-- 添加约束：email或phone至少有一个不为空
ALTER TABLE users ADD CONSTRAINT users_email_or_phone_required
  CHECK ((email IS NOT NULL) OR (phone IS NOT NULL));

-- 创建手机号索引
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 2. 修改user_profiles表
-- 添加phone字段
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- 3. 数据迁移：为现有用户设置login_type
UPDATE users SET login_type = 'email' WHERE login_type IS NULL AND email IS NOT NULL;

-- 4. 验证查询
-- 检查是否还有未设置login_type的用户
SELECT COUNT(*) as unset_login_type_count FROM users WHERE login_type IS NULL;

-- 查看表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 示例：插入手机号用户
-- INSERT INTO users (id, phone, password_hash, login_type, created_at, updated_at)
-- VALUES (gen_random_uuid(), '13800138000', 'hashed_password', 'phone', NOW(), NOW());
