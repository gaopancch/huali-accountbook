# 密码重置邮件发送功能 - 快速开始

## 已完成的修改

### 1. 创建了Supabase Edge Function
**文件**: `supabase/functions/send-reset-password-email/index.ts`

这个函数负责：
- 通过163邮箱SMTP发送密码重置邮件
- 自动识别手机号运营商并转换为对应邮箱
- 支持邮箱和手机号两种重置方式

### 2. 修改了ForgotPassword组件
**文件**: `src/pages/ForgotPassword.tsx`

修改内容：
- 调用Edge Function发送邮件
- 邮件发送成功时不显示临时密码
- 邮件发送失败时显示临时密码作为备用方案
- 更新用户提示信息

## 快速配置步骤

### 第一步: 获取163邮箱授权码

1. 登录 mail.163.com
2. 设置 → POP3/SMTP/IMAP
3. 开启SMTP服务
4. 获取授权码(16位字符)
5. 保存授权码

### 第二步: 安装Supabase CLI

```bash
npm install -g supabase
```

### 第三步: 登录并关联项目

```bash
# 登录Supabase
supabase login

# 关联到您的项目(在项目目录下执行)
cd /Users/gaopan/Downloads/huali-accountbook
supabase link --project-ref YOUR_PROJECT_REF
```

### 第四步: 部署Edge Function

```bash
supabase functions deploy send-reset-password-email
```

### 第五步: 配置环境变量

在Supabase Dashboard中配置:

1. 访问 https://app.supabase.com
2. 选择项目 → Edge Functions → Settings
3. 添加环境变量:
   - `SMTP_HOST` = `smtp.163.com`
   - `SMTP_PORT` = `465`
   - `SMTP_USER` = `gaopancch@163.com`
   - `SMTP_PASSWORD` = `您的授权码`

或使用命令行:

```bash
supabase secrets set SMTP_HOST=smtp.163.com
supabase secrets set SMTP_PORT=465
supabase secrets set SMTP_USER=gaopancch@163.com
supabase secrets set SMTP_PASSWORD=您的授权码
```

### 第六步: 测试功能

1. 启动应用: `npm start`
2. 访问忘记密码页面: `http://localhost:3000/forgot-password`
3. 测试邮箱找回和手机找回功能

## 手机号运营商邮箱映射

| 运营商 | 邮箱格式 | 开通方式 |
|--------|----------|----------|
| 移动 | 手机号@139.com | 发送`KT`到10086 |
| 电信 | 手机号@189.cn | 发送`KT`到10001 |
| 联通 | 手机号@wo.cn | 发送`KT`到10010 |

**注意**: 手机号用户需要先开通运营商邮箱才能接收邮件。

## 工作流程

### 邮箱找回密码
1. 用户输入邮箱地址
2. 系统验证邮箱是否注册
3. 生成8位临时密码
4. 更新数据库密码
5. 调用Edge Function发送邮件
6. 用户在邮箱查收临时密码
7. 使用临时密码登录并修改密码

### 手机号找回密码
1. 用户输入手机号
2. 系统验证手机号是否注册
3. 识别运营商并转换为邮箱地址
4. 生成8位临时密码
5. 更新数据库密码
6. 调用Edge Function发送邮件到运营商邮箱
7. 用户在运营商邮箱查收临时密码
8. 使用临时密码登录并修改密码

## 容错机制

当邮件发送失败时(例如配置错误、网络问题):
- 页面会显示临时密码
- 用户仍可使用临时密码登录
- 显示警告提示说明是备用方案

## 常见问题

### Q: 邮件发送失败怎么办?
A: 检查环境变量配置是否正确，授权码是否有效。查看Edge Function日志: `supabase functions logs send-reset-password-email`

### Q: 如何查看Edge Function日志?
A: 使用命令 `supabase functions logs send-reset-password-email` 或在Supabase Dashboard查看

### Q: 可以使用其他邮箱吗?
A: 可以，修改环境变量即可。QQ邮箱使用smtp.qq.com，Gmail使用smtp.gmail.com等

### Q: 163邮箱有发送限制吗?
A: 是的，免费邮箱通常每日限制50-200封。如需大量发送，考虑使用企业邮箱或专业邮件服务。

## 详细文档

更多详细信息请参阅: [EMAIL_SETUP_GUIDE.md](./EMAIL_SETUP_GUIDE.md)

## 文件清单

- `supabase/functions/send-reset-password-email/index.ts` - Edge Function代码
- `src/pages/ForgotPassword.tsx` - 修改后的忘记密码页面
- `EMAIL_SETUP_GUIDE.md` - 详细配置指南
- `QUICK_START.md` - 本文档

---

**需要帮助?** 请查看详细文档或联系技术支持。
