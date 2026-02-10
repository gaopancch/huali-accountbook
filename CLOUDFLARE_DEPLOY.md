# 记账宝 - Cloudflare Pages 部署指南

## 部署步骤

### 方法一：通过 Cloudflare Dashboard（推荐，最简单）

#### 第一步：登录 Cloudflare
1. 访问 https://dash.cloudflare.com/sign-up
2. 注册或登录 Cloudflare 账号
3. 注册后进入 Dashboard

#### 第二步：创建新的 Pages 项目
1. 点击左侧菜单中的 **Workers & Pages**
2. 点击 **Create application**
3. 选择 **Pages** 标签
4. 点击 **Create a project**

#### 第三步：连接到 Git

**如果您有 GitHub 账号：**
1. 选择 **Connect to Git**
2. 授权 Cloudflare 访问您的 GitHub 账号
3. 选择 `huali-accountbook` 仓库

**如果您没有 GitHub 或不想用 Git：**
1. 选择 **Direct Upload**（直接上传）
2. 继续阅读下面的方法二

#### 第四步：配置构建设置
在 Git 连接页面，填写以下信息：

```
项目名称：huali-accountbook
生产分支：master
构建命令：npm run build
构建输出目录：build
```

#### 第五步：配置环境变量
在 Environment variables 部分添加：

```
REACT_APP_SUPABASE_URL = https://bornarwknlwajpknkmam.supabase.co
REACT_APP_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcm5hcndrbmx3YWpwa25rbWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2Njk2ODMsImV4cCI6MjA4NjI0NTY4M30.m61yQCgYWTLbQsY1HuCLRQxd7N5cbdjWk4ihEuB4CvQ
```

#### 第六步：部署
1. 点击 **Save and Deploy**
2. 等待 2-3 分钟构建完成
3. 部署成功后会显示您的网站地址（类似：https://huali-accountbook.pages.dev）

---

### 方法二：通过 Wrangler CLI

#### 第一步：安装 Wrangler
```bash
npm install -g wrangler
```

#### 第二步：登录 Cloudflare
```bash
wrangler login
```
这会打开浏览器让您授权。

#### 第三步：进入项目目录
```bash
cd /Users/gaopan/Downloads/huali-accountbook
```

#### 第四步：构建项目
```bash
npm run build
```

#### 第五步：部署
```bash
wrangler pages deploy build --project-name huali-accountbook
```

#### 第六步：配置环境变量
```bash
wrangler pages secret put REACT_APP_SUPABASE_URL
# 输入: https://bornarwknlwajpknkmam.supabase.co

wrangler pages secret put REACT_APP_SUPABASE_ANON_KEY
# 输入: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvcm5hcndrbmx3YWpwa25rbWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2Njk2ODMsImV4cCI6MjA4NjI0NTY4M30.m61yQCgYWTLbQsY1HuCLRQxd7N5cbdjWk4ihEuB4CvQ
```

---

## 部署后的操作

### 绑定自定义域名（可选）

1. 在 Cloudflare Pages 项目中
2. 点击 **Custom domains**
3. 点击 **Set up a custom domain**
4. 输入您的域名（如：account.yourdomain.com）
5. 系统会自动配置 DNS

### 设置预览部署

每次推送到 `master` 分支会自动部署：
- 预览部署：`.preview.pages.dev`
- 生产部署：`.pages.dev`

---

## Cloudflare Pages 优势

- ✅ **无限带宽** - 不用担心流量超限
- ✅ **无限构建时间** - 频繁部署也没问题
- ✅ **全球 CDN** - 世界各地访问都很快
- ✅ **中国加速** - Cloudflare 在中国有节点
- ✅ **免费 SSL** - 自动配置 HTTPS
- ✅ **私有仓库支持** - 代码不需要公开
- ✅ **环境变量加密** - 密钥安全存储

---

## 故障排除

### 构建失败
检查 package.json 中的 script 配置是否正确。

### 某些文件未上传
确保在项目根目录有 `_redirects` 和 `_headers` 文件。

### 环境变量不生效
- 确保变量名以 `REACT_APP_` 开头
- 重新部署项目

---

## 与 Netlify 迁移对比

| 特性 | Netlify | Cloudflare Pages |
|------|---------|------------------|
| 月度带宽 | 100GB（付费） | **无限（免费）** |
| 构建时间 | 300分钟/月 | **无限（免费）** |
| 私有仓库 | ✅ | ✅ |
| 自定义域名 | ✅ | ✅ |
| 中国访问 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
