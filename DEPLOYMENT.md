# 部署指南

本文档详细介绍如何将记账宝应用部署到生产环境。

## 部署平台：Cloudflare Pages

Cloudflare Pages 是一个快速、免费的静态网站部署平台，非常适合 React 应用的部署。

## 前置准备

### 1. 获取代码

```bash
# 克隆仓库
git clone https://github.com/gaopancch/huali-accountbook.git
cd huali-accountbook
```

### 2. 配置 Supabase

由于项目中已经在 `src/supabase.ts` 中配置了 Supabase，如果需要使用自己的 Supabase 实例：

1. 访问 https://supabase.com 创建新项目
2. 进入 **SQL Editor** 执行数据库表创建脚本
3. 进入 **Settings -> API** 获取：
   - Project URL
   - anon public key

## Cloudflare Pages 部署步骤

### 方法一：通过 Cloudflare Dashboard

#### 1. 连接 Git 仓库

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages**
3. 点击 **Create application** → **Pages** → **Connect to Git**
4. 授权 Cloudflare 访问你的 GitHub 账号
5. 选择 `huali-accountbook` 仓库

#### 2. 配置构建设置

在 **Build settings** 中配置：

| 设置项 | 值 |
|--------|-----|
| Framework preset | **Create React App** |
| Build command | `npm run build` |
| Build output directory | `build` |

**注意**：不要在 Deploy command 中添加 `npx wrangler deploy`，Cloudflare Pages 会自动处理部署。

#### 3. 配置环境变量

在项目的 **Settings → Environment variables** 中添加：

| 变量名 | 值 |
|--------|-----|
| `REACT_APP_SUPABASE_URL` | 你的 Supabase Project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | 你的 Supabase anon public key |

#### 4. 开始部署

点击 **Save and Deploy**，Cloudflare 会自动：
1. 拉取代码
2. 安装依赖
3. 执行构建命令
4. 部署到全球 CDN

### 方法二：通过 Wrangler CLI

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署
cd huali-accountbook
npm run build
wrangler pages deploy build
```

## 部署配置文件

项目中已包含 `.cloudflarepages.json` 配置文件：

```json
{
  "build_command": "npm run build",
  "destination_dir": "build",
  "preview_command": "npm start",
  "preview_docker_image": "node:18"
}
```

此文件可被 Cloudflare Pages 自动识别来配置构建设置。

## 自定义域名

### 1. 绑定现有域名

在 Cloudflare Pages 项目设置中：

1. 进入 **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入你的域名（如 `account.yourdomain.com`）

### 2. 配置 DNS

Cloudflare 会自动添加 DNS 记录，通常几分钟内生效。

## 环境变量管理

### 生产环境变量

确保在生产环境配置以下变量：

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

### 本地开发变量

创建 `.env` 文件：

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

## 构建优化

### 预部署检查

```bash
# 本地构建测试
npm run build

# 检查构建产物
ls -la build/
```

### 构建失败排查

如果部署失败，检查以下内容：

1. **依赖问题**：确保 package.json 中的依赖版本正确
2. **TypeScript 错误**：本地运行 `npm run build` 检查
3. **环境变量**：确认所有必需的环境变量已配置

## 持续集成

Cloudflare Pages 默认启用 CI/CD：

- **主分支更新**：自动部署到生产环境
- **预览部署**：每个 Pull Request 自动生成预览链接

## 本地部署测试

使用 `serve` 包测试构建产物：

```bash
npm install -g serve
npm run build
serve -s build -p 3000
```

## 常见问题

### Q: 部署后页面空白？

A: 检查浏览器控制台错误，通常是因为：
- 环境变量未配置
- Supabase 连接失败
- JavaScript 加载错误

### Q: 如何查看部署日志？

A: 在 Cloudflare Dashboard → 项目 → **Deployments** → 选择部署记录 → **Logs**

### Q: 如何回滚到之前的版本？

A: 在 **Deployments** 页面找到之前的版本，点击 **Deploy** 重新部署。

### Q: 构建超时怎么办？

A: Cloudflare Pages 免费版构建超时时间为 15 分钟，如果超时：
- 检查依赖安装时间
- 优化构建脚本
- 考虑升级到付费计划

## 安全建议

1. **环境变量**：永远不要在代码中硬编码敏感信息
2. **Supabase RLS**：启用行级安全策略保护数据
3. **HTTPS**：Cloudflare Pages 默认提供 SSL 证书
4. **速率限制**：配置 Cloudflare 速率限制防止滥用
