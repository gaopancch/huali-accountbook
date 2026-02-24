// Supabase Edge Function for sending password reset emails
// This function handles sending password reset emails via SMTP

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

    // 使用原生方式发送SMTP邮件
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

    // 建立SMTP连接并发送邮件
    const conn = await Deno.connect({
      hostname: smtpHost,
      port: smtpPort,
      transport: "tcp",
    });

    // 升级到TLS
    const tlsConn = await Deno.startTls(conn, { hostname: smtpHost });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // 读取响应的辅助函数
    const readResponse = async () => {
      const buffer = new Uint8Array(1024);
      const n = await tlsConn.read(buffer);
      if (n === null) return '';
      return decoder.decode(buffer.subarray(0, n));
    };

    // 发送命令的辅助函数
    const sendCommand = async (cmd: string) => {
      await tlsConn.write(encoder.encode(cmd + '\r\n'));
      return await readResponse();
    };

    try {
      // 读取服务器欢迎消息
      await readResponse();

      // EHLO
      await sendCommand(`EHLO ${smtpHost}`);

      // AUTH LOGIN
      await sendCommand('AUTH LOGIN');

      // 发送用户名（Base64编码）
      const base64User = btoa(smtpUser);
      await sendCommand(base64User);

      // 发送密码（Base64编码）
      const base64Pass = btoa(smtpPassword);
      await sendCommand(base64Pass);

      // MAIL FROM
      await sendCommand(`MAIL FROM:<${smtpUser}>`);

      // RCPT TO
      await sendCommand(`RCPT TO:<${recipientEmail}>`);

      // DATA
      await sendCommand('DATA');

      // 邮件内容
      const emailContent = [
        `From: ${smtpUser}`,
        `To: ${recipientEmail}`,
        `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        btoa(unescape(encodeURIComponent(body))),
        '.',
      ].join('\r\n');

      await sendCommand(emailContent);

      // QUIT
      await sendCommand('QUIT');

    } finally {
      tlsConn.close();
    }

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
