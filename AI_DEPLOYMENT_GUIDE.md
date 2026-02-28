# AI 助手 - Cloudflare Workers AI 部署指南

## 概述

本应用的 AI 助手功能使用 Cloudflare Workers AI，完全免费，无需用户自己获取 API Key。

## 架构说明

```
用户前端 → Cloudflare Worker (AI 中转服务) → Cloudflare Workers AI
```

- **前端**：直接调用部署在 Cloudflare 的 Worker
- **Worker**：中转请求到 Workers AI，处理响应
- **Workers AI**：Cloudflare 提供的免费 AI 服务

## 部署步骤

### 1. 部署 Cloudflare Worker

#### 方式一：使用 Wrangler CLI（推荐）

```bash
# 1. 进入项目目录
cd /Users/gaopan/Downloads/huali-accountbook

# 2. 使用 wrangler 部署 Worker
npx wrangler@latest deploy worker-ai-chat.js --config wrangler-ai.toml --name huali-ai-chat

# 注意：如果 Node.js 版本 < 20，可以使用在线部署
```

#### 方式二：Cloudflare Dashboard 部署（推荐，无需升级 Node.js）

1. **访问 Cloudflare Dashboard**
   - 打开 https://dash.cloudflare.com
   - 进入 **Workers & Pages**
   - 点击 **Create application** → **Create Worker**

2. **创建 Worker**
   - Worker 名称：`huali-ai-chat`
   - 点击 **Deploy**

3. **编辑 Worker 代码**
   - 点击 **Edit Code**
   - 删除默认代码
   - 复制 `/Users/gaopan/Downloads/huali-accountbook/worker-ai-chat.js` 的全部内容
   - 粘贴到编辑器
   - 点击 **Save and Deploy**

4. **绑定 Workers AI**
   - 返回 Worker 详情页面
   - 点击 **Settings** → **Variables**
   - 找到 **AI Bindings** 部分
   - 点击 **Add binding**
   - Variable name: `AI`
   - 点击 **Save**

5. **获取 Worker URL**
   - 部署成功后会显示 Worker URL
   - 格式类似：`https://huali-ai-chat.your-subdomain.workers.dev`
   - 复制这个 URL

### 2. 配置前端环境变量

在项目根目录的 `.env` 文件中添加：

```env
REACT_APP_AI_WORKER_URL=https://huali-ai-chat.your-subdomain.workers.dev
```

替换为你的实际 Worker URL。

### 3. 在 Cloudflare Pages 中配置环境变量

如果你使用 Cloudflare Pages 部署前端：

1. 进入你的 Cloudflare Pages 项目
2. 点击 **Settings** → **Environment variables**
3. 添加变量：
   - **Variable name**: `REACT_APP_AI_WORKER_URL`
   - **Value**: `https://huali-ai-chat.your-subdomain.workers.dev`
4. 点击 **Save**
5. 重新部署项目

### 4. 测试 AI 功能

1. 访问你的应用
2. 登录后进入 Profile 页面
3. 点击 "🤖 AI 助手"
4. 输入消息测试对话功能

## 费用说明

### Cloudflare Workers 免费额度

- **每天 100,000 次请求**（Worker 调用）
- **每天 10 CPU 毫秒/请求**（超过部分按量计费）

### Cloudflare Workers AI 免费额度

- **每天 10,000 Neurons**
- 1 次 AI 请求 ≈ 100-500 Neurons（取决于输入输出长度）
- 大约每天可以处理 **20-100 次对话**

对于个人使用完全够用！

## 使用的 AI 模型

当前使用：`@cf/meta/llama-3.1-8b-instruct`

特点：
- ✅ 免费
- ✅ 支持中文
- ✅ 响应速度快
- ✅ 质量不错

你也可以在 `worker-ai-chat.js` 中更换为其他模型：
- `@cf/meta/llama-3-8b-instruct`
- `@cf/mistral/mistral-7b-instruct-v0.1`
- 更多模型：https://developers.cloudflare.com/workers-ai/models/

## 故障排除

### 1. Worker 部署失败

**问题**：Node.js 版本过低
**解决**：使用 Cloudflare Dashboard 在线部署（见方式二）

### 2. AI 无响应

**可能原因**：
- Worker URL 未配置或配置错误
- Workers AI 绑定未设置
- 超出免费额度

**解决方法**：
1. 检查 `.env` 文件中的 `REACT_APP_AI_WORKER_URL`
2. 检查 Worker 的 AI Bindings 是否正确设置
3. 在 Cloudflare Dashboard 查看 Worker 日志

### 3. CORS 错误

**解决**：确保 Worker 代码中包含 CORS 头设置（已包含在代码中）

### 4. 请求过于频繁

**提示**：`请求过于频繁，请稍后再试`
**原因**：超出每日免费额度
**解决**：等待第二天或升级到付费计划

## 本地开发测试

如果想在本地测试 Worker：

```bash
# 1. 安装 wrangler
npm install -g wrangler

# 2. 登录 Cloudflare
wrangler login

# 3. 启动本地开发服务器
npx wrangler dev worker-ai-chat.js --config wrangler-ai.toml

# 4. Worker 会运行在 http://localhost:8787
# 修改 .env 中的 URL 为 http://localhost:8787
```

## 安全说明

- Worker 已配置 CORS，只允许来自你的域名的请求
- 无需暴露 API Key，所有认证由 Cloudflare 处理
- 对话历史只保存在用户浏览器本地，不上传服务器

## 参考文档

- [Cloudflare Workers AI 文档](https://developers.cloudflare.com/workers-ai/)
- [Workers AI 模型列表](https://developers.cloudflare.com/workers-ai/models/)
- [Wrangler 文档](https://developers.cloudflare.com/workers/wrangler/)
