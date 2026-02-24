import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Record as RecordType, Book } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency, formatPercentage } from '../utils/formatNumber';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

const Statistics: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<RecordType[]>([]);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Statistics: useEffect triggered, currentBookId:', userProfile?.currentBookId);
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, selectedMonth, userProfile?.currentBookId]);

  const loadData = async () => {
    if (!currentUser) return;

    try {
      // Load all books where user is a member or owner
      // First get books where user is owner
      const { data: ownedBooks, error: ownedError } = await supabase
        .from('books')
        .select('*')
        .eq('owner_id', currentUser.uid);

      if (ownedError) throw ownedError;

      // Then get books where user is in members array
      const { data: sharedBooks, error: sharedError } = await supabase
        .from('books')
        .select('*')
        .contains('members', [currentUser.uid]);

      if (sharedError) throw sharedError;

      // Combine and deduplicate
      const bookIds = new Set();
      const allBooksData = [...(ownedBooks || []), ...(sharedBooks || [])].filter(book => {
        if (bookIds.has(book.id)) return false;
        bookIds.add(book.id);
        return true;
      });

      const allBooks = (allBooksData || []).map(book => ({
        id: book.id,
        name: book.name,
        ownerId: book.owner_id,
        ownerName: book.owner_name,
        members: book.members || [],
        isDefault: book.is_default,
        incomeCategories: book.income_categories,
        expenseCategories: book.expense_categories,
        createdAt: new Date(book.created_at),
        updatedAt: new Date(book.updated_at),
      } as Book));

      // Get current book based on user's selection or fallback to default
      let selectedBook = null;
      if (userProfile?.currentBookId) {
        selectedBook = allBooks.find(b => b.id === userProfile.currentBookId);
      }
      if (!selectedBook) {
        selectedBook = allBooks.find(b => b.isDefault && b.ownerId === currentUser.uid) || allBooks[0];
      }
      setCurrentBook(selectedBook);

      if (selectedBook) {
        const { data: recordsData, error: recordsError } = await supabase
          .from('records')
          .select('*')
          .eq('book_id', selectedBook.id)
          .like('date', `${selectedMonth}%`);

        if (recordsError) throw recordsError;

        const records = (recordsData || []).map(record => ({
          id: record.id,
          bookId: record.book_id,
          type: record.type,
          category: record.category,
          amount: record.amount,
          remark: record.remark,
          date: record.date,
          createdAt: new Date(record.created_at),
          updatedAt: new Date(record.updated_at),
        } as RecordType));

        setRecords(records);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const incomeRecords = records.filter(r => r.type === 'income');
  const expenseRecords = records.filter(r => r.type === 'expense');

  const totalIncome = incomeRecords.reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = expenseRecords.reduce((sum, r) => sum + r.amount, 0);

  // Group by category
  const groupByCategory = (records: RecordType[]) => {
    const groups: { [key: string]: number } = {};
    records.forEach(r => {
      groups[r.category] = (groups[r.category] || 0) + r.amount;
    });
    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const incomeData = groupByCategory(incomeRecords);
  const expenseData = groupByCategory(expenseRecords);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <h1 className="text-xl font-bold text-center">统计分析</h1>
      </div>

      {/* Month Selector */}
      <div className="p-4">
        <input
          type="month"
          value={selectedMonth}
          max={new Date().toISOString().slice(0, 7)}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
      </div>

      {/* Summary */}
      <div className="px-4 mb-6">
        <div className="bg-gradient-to-r from-primary to-green-600 text-white rounded-2xl p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm opacity-80">本月收入</div>
              <div className="text-2xl font-bold">¥{formatCurrency(totalIncome)}</div>
            </div>
            <div>
              <div className="text-sm opacity-80">本月支出</div>
              <div className="text-2xl font-bold">¥{formatCurrency(totalExpense)}</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white border-opacity-30">
            <div className="text-sm opacity-80">结余</div>
            <div className="text-2xl font-bold">¥{formatCurrency(totalIncome - totalExpense)}</div>
          </div>
        </div>
      </div>

      {/* Expense Analysis */}
      {expenseRecords.length > 0 && (
        <div className="px-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-bold mb-4 text-expense">支出分析</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={expenseData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.name} ¥${formatCurrency(entry.value, 0)}`}
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `¥${formatCurrency(Number(value))}`} />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {expenseData.map((item, index) => (
                <div key={item.name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span>{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">¥{formatCurrency(item.value)}</div>
                    <div className="text-xs text-gray-500">
                      {formatPercentage((item.value / totalExpense) * 100)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Income Analysis */}
      {incomeRecords.length > 0 && (
        <div className="px-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-bold mb-4 text-income">收入分析</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={incomeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.name} ¥${formatCurrency(entry.value, 0)}`}
                >
                  {incomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `¥${formatCurrency(Number(value))}`} />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {incomeData.map((item, index) => (
                <div key={item.name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span>{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">¥{formatCurrency(item.value)}</div>
                    <div className="text-xs text-gray-500">
                      {formatPercentage((item.value / totalIncome) * 100)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {records.length === 0 && (
        <div className="text-center text-gray-500 mt-20">
          <p>本月暂无记账记录</p>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-2">
          <div className="flex justify-around items-center">
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center py-2 text-gray-600"
          >
            <span>首页</span>
          </button>

          <button
            onClick={() => navigate('/add-record')}
            className="bg-primary text-white rounded-full w-14 h-14 flex items-center justify-center text-3xl -mt-6 shadow-lg"
          >
            +
          </button>

          <button
            onClick={() => navigate('/statistics')}
            className="flex flex-col items-center py-2 text-primary"
          >
            <span>统计</span>
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
