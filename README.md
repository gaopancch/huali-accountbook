# 记账宝 - 简洁实用的记账应用

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/huali-accountbook)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

一个基于 React + TypeScript + Supabase 构建的现代化记账应用，支持多账本管理、账本共享、数据统计和 Excel 导出。https://huali-accountbook.pages.dev/

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

### 📚 英语学习模块
- **智能词汇学习系统**
  - 初始加载5个数据库精选单词
  - AI自动生成30个今日词汇，后台异步加载
  - 学完固定单词后无缝切换到AI生成词汇
  - 学习进度达到一半时自动继续生成新词汇
  - 支持无限学习，词汇源源不断
- **每日一句**
  - 精选英文句子及翻译
  - 标注重点词汇和使用场景
  - 基于日期确保每天内容一致
- **学习统计**
  - 连续打卡天数追踪
  - 累计学习单词数统计
  - 已掌握单词和收藏统计
  - 90天学习日历热力图
- **交互式单词卡片**
  - 翻转卡片查看释义和例句
  - 标记单词为"已掌握"
  - 收藏重要单词
  - 流畅的动画效果

### 🤖 AI 助手
- 基于 Cloudflare Workers AI
- 智能对话问答
- 支持多轮对话
- 免费使用，无需API密钥
- 词汇生成采用AI技术，确保单词的多样性和实用性

## 🛠️ 技术栈

### 前端
- **框架**: React 18.3.1
- **语言**: TypeScript 4.9.5
- **路由**: React Router 6.30.3
- **样式**: Tailwind CSS 3.4.19
- **图表**: Recharts 3.7.0
- **构建**: Create React App 5.0.1

### 后端服务
- **数据库**: Supabase (PostgreSQL)
- **认证**: 自定义认证系统
- **存储**: Supabase Storage
- **AI服务**: Cloudflare Workers AI (词汇生成、智能问答)

### 部署
- **平台**: Cloudflare Pages
- **构建**: 自动化 CI/CD
- **API代理**: Cloudflare Pages Functions

## 📦 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖
```bash
npm install
```

### 配置环境变量
创建 `.env` 文件并配置相关信息：

```env
# Supabase 配置
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI 服务配置 (可选)
REACT_APP_AI_WORKER_URL=/api/ai-chat
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
├── functions/           # Cloudflare Pages Functions
│   └── api/
│       └── ai-chat.js   # AI 聊天代理函数
├── src/
│   ├── components/      # 可复用组件
│   │   └── english/     # 英语学习组件
│   │       ├── WordCard.tsx          # 单词卡片组件
│   │       ├── DailySentence.tsx     # 每日一句组件
│   │       ├── LearningStats.tsx     # 学习统计组件
│   │       └── StudyCalendar.tsx     # 学习日历热力图
│   ├── context/        # React Context (认证等)
│   ├── pages/          # 页面组件
│   │   ├── Home.tsx           # 首页 - 记录列表
│   │   ├── AddRecord.tsx      # 添加/编辑记录
│   │   ├── Statistics.tsx     # 统计页面
│   │   ├── Profile.tsx        # 个人中心
│   │   ├── Login.tsx          # 登录页
│   │   ├── Signup.tsx         # 注册页
│   │   ├── LearnEnglish.tsx   # 英语学习页面
│   │   └── AIChat.tsx         # AI 助手页面
│   ├── services/       # API 服务
│   │   ├── supabase-auth.ts   # 认证服务
│   │   ├── db.ts              # 数据库服务
│   │   ├── englishAPI.ts      # 英语学习 API
│   │   ├── cloudflareAI.ts    # Cloudflare AI 服务
│   │   └── geminiAPI.ts       # Gemini API 服务
│   ├── types/          # TypeScript 类型定义
│   │   ├── index.ts           # 通用类型
│   │   ├── english.ts         # 英语学习类型
│   │   └── ai.ts              # AI 服务类型
│   ├── utils/          # 工具函数
│   │   └── exportExcel.ts     # Excel 导出
│   ├── supabase.ts     # Supabase 配置
│   ├── App.tsx         # 应用入口
│   └── version.ts      # 版本信息
├── .env                # 环境变量
├── .cloudflarepages.json      # Cloudflare Pages 配置
├── database-english-module.sql # 英语模块数据库架构
├── package.json        # 项目配置
└── README.md          # 项目文档
```

## 🗄️ 数据库架构

### 核心业务表

#### users 表
用户认证信息
- `uid`: UUID 主键
- `email`: 邮箱
- `password_hash`: 密码哈希
- `created_at`: 创建时间

#### user_profiles 表
用户资料
- `uid`: 用户 ID (主键)
- `email`: 邮箱
- `display_name`: 显示名称
- `current_book_id`: 当前选中的账本 ID
- `created_at`: 创建时间

#### books 表
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

#### records 表
记账记录
- `id`: UUID 主键
- `book_id`: 所属账本 ID
- `type`: 类型 (income/expense)
- `category`: 分类
- `amount`: 金额
- `remark`: 备注 (可选)
- `date`: 日期 (YYYY-MM-DD)
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 英语学习模块表

#### english_words 表
英语单词库
- `id`: UUID 主键
- `word`: 单词 (英文)
- `phonetic`: 音标
- `definition`: 定义 (英文)
- `example`: 例句 (英文)
- `translation`: 例句翻译 (中文)
- `level`: CEFR等级 (A1/A2/B1/B2/C1/C2)
- `category`: 分类 (日常用语/职场/旅行/餐饮等)
- `created_at`: 创建时间

#### user_word_progress 表
用户单词学习进度
- `id`: UUID 主键
- `user_id`: 用户 ID
- `word_id`: 单词 ID (外键)
- `status`: 状态 (learning/mastered)
- `is_favorite`: 是否收藏
- `learned_date`: 学习日期
- `review_count`: 复习次数
- `created_at`: 创建时间
- `updated_at`: 更新时间

#### daily_sentences 表
每日一句库
- `id`: UUID 主键
- `sentence`: 英文句子
- `translation`: 中文翻译
- `keywords`: 重点词汇数组
- `scene`: 使用场景
- `created_at`: 创建时间

#### user_study_logs 表
用户学习日志
- `id`: UUID 主键
- `user_id`: 用户 ID
- `study_date`: 学习日期
- `words_learned`: 学习的单词数
- `study_duration`: 学习时长 (分钟)
- `created_at`: 创建时间

## 🚀 部署指南

### Cloudflare Pages 部署

1. **准备工作**
   - Fork 本仓库到你的 GitHub 账号
   - 创建并配置 Supabase 项目

2. **在 Cloudflare 创建 Pages 项目**
   - 访问 Cloudflare Dashboard
   - 进入 **Workers & Pages**
   - 点击 **Create application**
   - 选择 **Connect to Git**
   - 授权并选择你的 GitHub 仓库

3. **配置构建设置**

   | 设置项 | 值 |
   |--------|-----|
   | Framework preset | **Create React App** |
   | Build command | `npm run build` |
   | Build output directory | `build` |

4. **配置环境变量**
   在项目设置的 **Environment variables** 中添加：
   - `REACT_APP_SUPABASE_URL`: 你的 Supabase 项目 URL
   - `REACT_APP_SUPABASE_ANON_KEY`: 你的 Supabase anon public key
   - `REACT_APP_AI_WORKER_URL`: (可选) AI Worker URL，默认 `/api/ai-chat`

5. **部署应用**
   - 保存配置后，Cloudflare 会自动开始构建和部署
   - 每次 push 到主分支会自动触发重新部署

### 本地部署

使用 `serve` 包部署构建结果：

```bash
npm install -g serve
serve -s build -p 3000
```

### Supabase 配置

1. **创建 Supabase 项目**
   - 访问 https://supabase.com
   - 创建新项目

2. **执行数据库架构**
   - 进入 SQL Editor
   - 执行数据库表创建脚本

3. **获取 API 密钥**
   - 进入 Settings -> API
   - 复制 Project URL 和 anon public key

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
- [Cloudflare Pages](https://pages.cloudflare.com/) - 部署平台

---

Made with ❤️ by huali-accountbook
