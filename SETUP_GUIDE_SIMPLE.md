# 邮件功能快速配置指南（通过网页界面）

您的授权码：**YMbTVvDUfLguVJf3**

由于CLI安装可能比较复杂，我们使用Supabase Dashboard网页界面来配置，更加简单直接。

## 方式一：使用Supabase Dashboard手动创建（推荐）

### 步骤1: 登录Supabase Dashboard

1. 访问 https://app.supabase.com
2. 登录您的账号
3. 选择您的项目（huali-accountbook）

### 步骤2: 创建Edge Function

1. 在左侧菜单中，点击 **"Edge Functions"**
2. 点击右上角的 **"Create a new function"** 或 **"New Edge Function"** 按钮
3. 输入函数名称：`send-reset-password-email`
4. 点击 **"Create function"**

### 步骤3: 上传函数代码

1. 在新创建的函数页面，找到代码编辑器
2. 将以下代码完整复制并粘贴到编辑器中：

```typescript
// Supabase Edge Function for sending password reset emails
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 手机号前缀到运营商邮箱后缀的映射
const getCarrierEmailDomain = (phone: string): string | null => {
  // 移动号段
  const cmccPrefixes = ['134', '135', '136', '137', '138', '139', '147', '148', '150', '151', '152', '157', '158', '159', '172', '178', '182', '183', '184', '187', '188', '195', '197', '198'];
  // 联通号段
  const unicomPrefixes = ['130', '131', '132', '145', '146', '155', '156', '166', '167', '171', '175', '176', '185', '186', '196'];
  // 电信号段
  const telecomPrefixes = ['133', '149', '153', '173', '174', '177', '180', '181', '189', '190', '191', '193', '199'];

  const prefix = phone.substring(0, 3);

  if (cmccPrefixes.includes(prefix)) {
    return '139.com'; // 移动139邮箱
  } else if (unicomPrefixes.includes(prefix)) {
    return 'wo.cn'; // 联通沃邮箱
  } else if (telecomPrefixes.includes(prefix)) {
    return '189.cn'; // 电信189邮箱
  }

  return null; // 未知运营商
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, phone, tempPassword, loginType } = await req.json()

    // 验证必需参数
    if (!tempPassword) {
      throw new Error('Missing required parameter: tempPassword')
    }

    if (!loginType || (loginType !== 'email' && loginType !== 'phone')) {
      throw new Error('Invalid loginType')
    }

    if (loginType === 'email' && !email) {
      throw new Error('Email is required for email login type')
    }

    if (loginType === 'phone' && !phone) {
      throw new Error('Phone is required for phone login type')
    }

    // 确定收件人地址
    let recipientEmail = '';
    if (loginType === 'email') {
      recipientEmail = email;
    } else {
      // 手机号用户，转换为运营商邮箱
      const domain = getCarrierEmailDomain(phone);
      if (!domain) {
        throw new Error('无法识别手机号运营商，请联系管理员');
      }
      recipientEmail = `${phone}@${domain}`;
    }

    // 获取环境变量中的SMTP配置
    const smtpHost = Deno.env.get('SMTP_HOST') || 'smtp.163.com';
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '465');
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPassword = Deno.env.get('SMTP_PASSWORD'); // 这里应该是授权码

    if (!smtpUser || !smtpPassword) {
      throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD environment variables.');
    }

    // 创建SMTP客户端
    const client = new SmtpClient();

    // 连接到SMTP服务器
    await client.connectTLS({
      hostname: smtpHost,
      port: smtpPort,
      username: smtpUser,
      password: smtpPassword,
    });

    // 准备邮件内容
    const subject = '【记账宝】密码重置通知';
    const body = `
尊敬的用户，您好！

您的临时密码为：${tempPassword}

请使用此临时密码登录系统，登录后请立即修改密码以确保账户安全。

温馨提示：
1. 此临时密码仅用于本次登录
2. 请妥善保管您的密码，不要告诉他人
3. 如非本人操作，请立即联系客服

此邮件由系统自动发送，请勿直接回复。

记账宝团队
${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
    `.trim();

    // 发送邮件
    await client.send({
      from: smtpUser,
      to: recipientEmail,
      subject: subject,
      content: body,
    });

    // 关闭连接
    await client.close();

    return new Response(
      JSON.stringify({
        success: true,
        message: '密码重置邮件已发送',
        recipientEmail: recipientEmail
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error sending email:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || '发送邮件失败，请稍后再试'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
```

3. 点击 **"Save"** 或 **"Deploy"** 按钮保存并部署函数

### 步骤4: 配置环境变量（Secrets）

1. 在Edge Functions页面，点击左侧的 **"Settings"** 或顶部的 **"Secrets"** 标签
2. 添加以下4个环境变量（点击"Add new secret"或类似按钮）：

| 名称 | 值 |
|------|-----|
| `SMTP_HOST` | `smtp.163.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `gaopancch@163.com` |
| `SMTP_PASSWORD` | `YMbTVvDUfLguVJf3` |

**重要**: 确保每个变量名和值都准确输入，注意大小写。

3. 保存配置

### 步骤5: 获取Edge Function URL

1. 在Edge Function详情页面，找到函数的URL地址
2. 格式通常类似：`https://xxxxx.supabase.co/functions/v1/send-reset-password-email`
3. 复制这个URL（稍后测试时需要用到）

---

## 方式二：等待CLI安装完成后使用命令行部署

如果您愿意等待Homebrew安装完成，可以使用命令行方式：

### 等待安装完成

CLI正在后台安装中，等待安装完成后执行：

```bash
# 验证安装
supabase --version

# 登录Supabase
supabase login

# 进入项目目录
cd /Users/gaopan/Downloads/huali-accountbook

# 关联项目
supabase link --project-ref YOUR_PROJECT_REF

# 部署函数
supabase functions deploy send-reset-password-email

# 配置环境变量
supabase secrets set SMTP_HOST=smtp.163.com
supabase secrets set SMTP_PORT=465
supabase secrets set SMTP_USER=gaopancch@163.com
supabase secrets set SMTP_PASSWORD=YMbTVvDUfLguVJf3
```

---

## 下一步：测试功能

完成上述配置后：

### 1. 启动应用

```bash
cd /Users/gaopan/Downloads/huali-accountbook
npm start
```

### 2. 测试邮箱找回

1. 访问 http://localhost:3000/forgot-password
2. 选择"邮箱找回"
3. 输入一个已注册的邮箱地址
4. 点击"重置密码"
5. 检查是否收到邮件

### 3. 测试手机号找回

1. 选择"手机找回"
2. 输入一个已注册的手机号
3. 点击"重置密码"
4. 检查对应的运营商邮箱是否收到邮件

**手机号用户请注意**：需要先开通运营商邮箱才能收到邮件
- 移动用户：发送 `KT` 到 `10086` 开通139邮箱
- 电信用户：发送 `KT` 到 `10001` 开通189邮箱
- 联通用户：发送 `KT` 到 `10010` 开通沃邮箱

---

## 常见问题

### Q: 找不到Edge Functions菜单？
A: 确保您的Supabase项目已启用Edge Functions功能。如果没有看到，可能需要升级项目计划或联系Supabase支持。

### Q: 代码保存后如何确认部署成功？
A: 在Edge Function页面应该能看到部署状态和最后部署时间。也可以在"Logs"标签查看运行日志。

### Q: 如何查看函数是否正常工作？
A: 测试应用时，如果邮件发送失败，页面会显示临时密码。查看Supabase Dashboard的Edge Functions日志可以看到详细的错误信息。

### Q: 邮件发送失败怎么办？
A:
1. 检查环境变量配置是否正确
2. 确认授权码有效（YMbTVvDUfLguVJf3）
3. 查看Edge Function的Logs标签，查看具体错误
4. 确保163邮箱的IMAP/SMTP已开启

---

**推荐方式**：使用方式一（Dashboard网页界面），更简单直观，适合快速配置。

完成配置后，请告诉我结果，我会帮助您进行测试和排查问题。
