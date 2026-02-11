/**
 * 验证中国大陆手机号格式
 * 格式：1[3-9]\d{9}
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 格式化手机号（去除空格和横线）
 */
export function formatPhone(phone: string): string {
  return phone.replace(/[\s-]/g, '');
}
