# 记账宝 - 简洁实用的记账应用

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/huali-accountbook)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Netlify Status](https://api.netlify.com/api/v1/badges/your-badge-id/deploy-status)](https://richyou.netlify.app)

一个基于 React + TypeScript + Supabase 构建的现代化记账应用，支持多账本管理、账本共享、数据统计和 Excel 导出。

🔗 **在线体验**: [https://richyou.netlify.app](https://richyou.netlify.app)

## ✨ 功能特性

### 🔐 用户认证
- 邮箱密码注册/登录
- 安全的密码加密存储 (SHA256)
- 本地登录状态保持

### 📒 账本管理
- 创建多个账本，分类管理不同账户
- 设置默认账本，快速记账
- 自定义收入/支出分类
- 删除和切换账本

### 💰 记账功能
- 快速添加收入/支出记录
- 支持分类、金额、日期、备注
- 编辑和删除已有记录
- 按日期自动分组显示

### 📊 数据统计
- 月度收支统计
- 按分类统计支出/收入
- 饼图可视化展示
- 支持切换月份查看历史数据

### 👥 账本共享
- 生成分享链接
- 邀请他人共同管理账本
- 共享成员可查看和添加记录
- 灵活的权限管理

### 📤 数据导出
- 导出账本为 Excel 文件
- 包含完整的收支记录
- 支持按日期排序
- 便于数据备份和分析

### 👤 个人设置
- 修改昵称
- 管理多个账本
- 账号注销功能

## 🛠️ 技术栈

### 前端
- **框架**: React 19.2.4
- **语言**: TypeScript 4.9.5
- **路由**: React Router 6.30.3
- **样式**: Tailwind CSS 3.4.1
- **图表**: Recharts 3.7.0
- **构建**: Create React App 5.0.1

### 后端服务
- **数据库**: Supabase (PostgreSQL)
- **认证**: 自定义认证系统
- **存储**: Supabase Storage

### 部署
- **平台**: Netlify
- **构建**: 自动化 CI/CD
- **域名**: richyou.netlify.app

## 📦 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖
```bash
npm install
```

### 配置环境变量
创建 `.env` 文件并配置 Supabase 连接信息：

```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 启动开发服务器
```bash
npm start
```

应用将在 http://localhost:3000 启动。

### 构建生产版本
```bash
npm run build
```

构建产物将生成在 `build/` 目录。

## 📁 项目结构

```
huali-accountbook/
├── public/              # 静态资源
├── src/
│   ├── components/      # 可复用组件
│   ├── context/        # React Context (认证等)
│   ├── pages/          # 页面组件
│   │   ├── Home.tsx           # 首页 - 记录列表
│   │   ├── AddRecord.tsx      # 添加/编辑记录
│   │   ├── Statistics.tsx     # 统计页面
│   │   ├── Profile.tsx        # 个人中心
│   │   ├── Login.tsx          # 登录页
│   │   ├── Signup.tsx         # 注册页
│   │   └── ShareBook.tsx      # 账本共享页
│   ├── services/       # API 服务
│   │   ├── supabase-auth.ts   # 认证服务
│   │   └── db.ts              # 数据库服务
│   ├── types/          # TypeScript 类型定义
│   ├── utils/          # 工具函数
│   ├── supabase.ts     # Supabase 配置
│   ├── App.tsx         # 应用入口
│   └── version.ts      # 版本信息
├── .env                # 环境变量
├── package.json        # 项目配置
└── README.md          # 项目文档
```

## 🗄️ 数据库架构

### users 表
用户认证信息
- `id`: UUID 主键
- `uid`: 用户唯一标识
- `email`: 邮箱
- `password_hash`: 密码哈希
- `display_name`: 显示名称
- `created_at`: 创建时间

### user_profiles 表
用户资料
- `id`: UUID 主键
- `uid`: 用户 ID
- `display_name`: 显示名称
- `current_book_id`: 当前选中的账本 ID
- `created_at`: 创建时间

### books 表
账本信息
- `id`: UUID 主键
- `name`: 账本名称
- `owner_id`: 所有者 ID
- `owner_name`: 所有者名称
- `members`: 成员 ID 数组
- `is_default`: 是否为默认账本
- `income_categories`: 收入分类数组
- `expense_categories`: 支出分类数组
- `created_at`: 创建时间
- `updated_at`: 更新时间

### records 表
记账记录
- `id`: UUID 主键
- `book_id`: 所属账本 ID
- `type`: 类型 (income/expense)
- `category`: 分类
- `amount`: 金额
- `remark`: 备注
- `date`: 日期 (YYYY-MM-DD)
- `created_at`: 创建时间
- `updated_at`: 更新时间

## 🚀 部署指南

### Netlify 部署

1. Fork 本仓库到你的 GitHub 账号

2. 在 Netlify 中创建新项目
   - 连接 GitHub 仓库
   - 设置构建命令: `npm run build`
   - 设置发布目录: `build`

3. 配置环境变量
   - 添加 `REACT_APP_SUPABASE_URL`
   - 添加 `REACT_APP_SUPABASE_ANON_KEY`

4. 部署应用
   - 每次 push 到主分支会自动部署

### Supabase 配置

1. 创建 Supabase 项目
   - 访问 https://supabase.com
   - 创建新项目

2. 执行数据库架构
   - 进入 SQL Editor
   - 执行 `database-schema.sql` 脚本

3. 获取 API 密钥
   - 进入 Settings -> API
   - 复制 Project URL 和 anon public key

详细部署步骤请参考 DEPLOYMENT.md 文件。

## 📝 开发规范

### 代码风格
- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用函数式组件和 Hooks
- 保持组件单一职责

### 提交规范
```
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建/工具链更新
```

## 🐛 问题反馈

如遇到问题，请：
1. 查看浏览器控制台错误信息
2. 检查 Supabase 数据库连接
3. 确认环境变量配置正确
4. 提交 Issue 到 GitHub

## 📄 开源协议

本项目采用 MIT 协议开源，详见 LICENSE 文件。

## 🙏 致谢

- [React](https://react.dev/) - 前端框架
- [Supabase](https://supabase.com/) - 后端服务
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Recharts](https://recharts.org/) - 图表库
- [Netlify](https://www.netlify.com/) - 部署平台

---

Made with ❤️ by Claude Code & You
