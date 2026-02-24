#!/bin/bash

# Supabase Edge Function 部署脚本
# 使用此脚本快速部署邮件发送功能

echo "=========================================="
echo "记账宝 - 邮件发送功能部署脚本"
echo "=========================================="
echo ""

# 检查Supabase CLI是否已安装
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI 未安装"
    echo "请先运行: brew install supabase/tap/supabase"
    exit 1
fi

echo "✅ Supabase CLI 已安装 (版本: $(supabase --version))"
echo ""

# 进入项目目录
cd /Users/gaopan/Downloads/huali-accountbook

echo "📁 当前目录: $(pwd)"
echo ""

# 步骤1: 登录Supabase
echo "步骤 1/4: 登录 Supabase"
echo "----------------------------------------"
echo "即将打开浏览器进行登录..."
echo "如果浏览器没有自动打开，请手动复制链接访问"
echo ""
supabase login

if [ $? -ne 0 ]; then
    echo "❌ 登录失败"
    exit 1
fi

echo "✅ 登录成功"
echo ""

# 步骤2: 关联项目
echo "步骤 2/4: 关联 Supabase 项目"
echo "----------------------------------------"
echo "请输入您的 Project Reference ID"
echo "（可在 Supabase Dashboard → Settings → General 中找到）"
echo ""
read -p "Project Ref: " PROJECT_REF

if [ -z "$PROJECT_REF" ]; then
    echo "❌ Project Reference ID 不能为空"
    exit 1
fi

supabase link --project-ref $PROJECT_REF

if [ $? -ne 0 ]; then
    echo "❌ 项目关联失败"
    exit 1
fi

echo "✅ 项目关联成功"
echo ""

# 步骤3: 部署Edge Function
echo "步骤 3/4: 部署 Edge Function"
echo "----------------------------------------"
supabase functions deploy send-reset-password-email

if [ $? -ne 0 ]; then
    echo "❌ Edge Function 部署失败"
    exit 1
fi

echo "✅ Edge Function 部署成功"
echo ""

# 步骤4: 配置环境变量
echo "步骤 4/4: 配置 SMTP 环境变量"
echo "----------------------------------------"

echo "设置 SMTP_HOST..."
supabase secrets set SMTP_HOST=smtp.163.com

echo "设置 SMTP_PORT..."
supabase secrets set SMTP_PORT=465

echo "设置 SMTP_USER..."
supabase secrets set SMTP_USER=gaopancch@163.com

echo "设置 SMTP_PASSWORD..."
echo "请输入您的163邮箱授权码:"
read -s SMTP_PASSWORD
supabase secrets set SMTP_PASSWORD=$SMTP_PASSWORD

if [ $? -ne 0 ]; then
    echo "❌ 环境变量配置失败"
    exit 1
fi

echo "✅ 环境变量配置成功"
echo ""

# 完成
echo "=========================================="
echo "🎉 部署完成！"
echo "=========================================="
echo ""
echo "下一步："
echo "1. 启动应用: npm start"
echo "2. 访问: http://localhost:3000/forgot-password"
echo "3. 测试邮箱或手机号找回密码功能"
echo ""
echo "查看函数日志:"
echo "supabase functions logs send-reset-password-email"
echo ""
echo "如有问题，请查看:"
echo "- EMAIL_SETUP_GUIDE.md (详细指南)"
echo "- SETUP_GUIDE_SIMPLE.md (快速指南)"
echo ""
