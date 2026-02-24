/**
 * 格式化数字显示，超过1万使用缩写形式
 * @param value 要格式化的数字
 * @param decimalPlaces 小数位数，默认为2
 * @returns 格式化后的字符串
 */
export function formatCurrency(value: number, decimalPlaces: number = 2): string {
  const absValue = Math.abs(value);

  // 小于1万，直接显示原始数字
  if (absValue < 10000) {
    return value.toFixed(decimalPlaces);
  }

  // 1万到1亿之间，显示为"万"
  if (absValue < 100000000) {
    const wanValue = value / 10000;
    return `${wanValue.toFixed(decimalPlaces)}万`;
  }

  // 1亿及以上，显示为"亿"
  const yiValue = value / 100000000;
  return `${yiValue.toFixed(decimalPlaces)}亿`;
}

/**
 * 格式化百分比显示
 * @param value 百分比值
 * @param decimalPlaces 小数位数，默认为1
 * @returns 格式化后的百分比字符串
 */
export function formatPercentage(value: number, decimalPlaces: number = 1): string {
  return `${value.toFixed(decimalPlaces)}%`;
}
