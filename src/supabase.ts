import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

console.log('===== Supabase 初始化 =====');
console.log('URL:', supabaseUrl);
console.log('AnonKey 存在:', !!supabaseAnonKey);
console.log('当前域名:', window.location.origin);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase配置缺失!');
  console.error('请在 .env 文件中设置:');
  console.error('REACT_APP_SUPABASE_URL=你的项目URL');
  console.error('REACT_APP_SUPABASE_ANON_KEY=你的anon密钥');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

console.log('✅ Supabase客户端已创建');
console.log('==========================');

export default supabase;
