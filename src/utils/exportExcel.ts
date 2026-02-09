import * as XLSX from 'xlsx';
import { Record } from '../types';

/**
 * 导出账本数据到Excel文件
 * @param records 账本记录数据
 * @param bookName 账本名称（用作文件名）
 */
export const exportBookToExcel = (records: Record[], bookName: string) => {
  // 准备Excel数据，将Record对象转换为表格行
  const excelData = records.map((record) => ({
    '日期': record.date,
    '类型': record.type === 'income' ? '收入' : '支出',
    '分类': record.category,
    '金额': record.amount,
    '备注': record.remark || '',
  }));

  // 创建工作表
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // 设置列宽
  const columnWidths = [
    { wch: 12 }, // 日期
    { wch: 8 },  // 类型
    { wch: 12 }, // 分类
    { wch: 12 }, // 金额
    { wch: 30 }, // 备注
  ];
  worksheet['!cols'] = columnWidths;

  // 创建工作簿
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '账本明细');

  // 导出Excel文件
  XLSX.writeFile(workbook, `${bookName}.xlsx`);
};
