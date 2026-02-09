import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Record as RecordType, Book } from '../types';

const Home: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [records, setRecords] = useState<RecordType[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Calculate totals
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthRecords = records.filter(r => r.date.startsWith(currentMonth));
  const income = monthRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
  const expense = monthRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
  const balance = income - expense;

  useEffect(() => {
    loadData();
  }, [currentUser, userProfile?.currentBookId]);

  const loadData = async () => {
    if (!currentUser) return;

    try {
      // Load books owned by user
      const booksQuery = query(collection(db, 'books'), where('ownerId', '==', currentUser.uid));
      const booksSnapshot = await getDocs(booksQuery);
      const ownedBooks = booksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));

      // Load books shared with user
      const allBooksQuery = query(collection(db, 'books'));
      const allBooksSnapshot = await getDocs(allBooksQuery);
      const sharedBooks = allBooksSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Book))
        .filter(book => book.sharedWith?.includes(currentUser.uid));

      // Combine owned and shared books
      const allBooks = [...ownedBooks, ...sharedBooks];
      setBooks(allBooks);

      // Get current book based on user's selection or fallback to default
      let selectedBook = null;
      if (userProfile?.currentBookId) {
        selectedBook = allBooks.find(b => b.id === userProfile.currentBookId);
      }
      if (!selectedBook) {
        selectedBook = allBooks.find(b => b.isDefault && b.ownerId === currentUser.uid) || allBooks[0];
      }
      setCurrentBook(selectedBook);

      // Load records for current book
      if (selectedBook) {
        const recordsQuery = query(
          collection(db, 'records'),
          where('bookId', '==', selectedBook.id)
        );
        const recordsSnapshot = await getDocs(recordsQuery);
        const recordsData = recordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RecordType));
        // Sort by date in JavaScript
        recordsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecords(recordsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group records by month
  const groupedRecords = records.reduce((groups, record) => {
    const month = record.date.slice(0, 7);
    if (!groups[month]) {
      groups[month] = [];
    }
    groups[month].push(record);
    return groups;
  }, {} as Record<string, RecordType[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-green-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">你好, {userProfile?.displayName}</h1>
          <button
            onClick={() => navigate('/profile')}
            className="text-sm bg-white bg-opacity-20 px-4 py-2 rounded-full hover:bg-opacity-30"
          >
            我的
          </button>
        </div>

        <div className="bg-white bg-opacity-20 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span>{currentBook?.name || '默认账本'}</span>
            <span>{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}</span>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <div className="text-xs opacity-80">收入</div>
              <div className="text-lg font-bold text-income">¥{income.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs opacity-80">支出</div>
              <div className="text-lg font-bold text-expense">¥{expense.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs opacity-80">结余</div>
              <div className="text-lg font-bold">¥{balance.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Records List */}
      <div className="p-4">
        {Object.keys(groupedRecords).length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <p>还没有记账记录</p>
            <p className="text-sm mt-2">点击下方 + 按钮开始记账</p>
          </div>
        ) : (
          Object.entries(groupedRecords).map(([month, monthRecords]) => (
            <div key={month} className="mb-6">
              <h3 className="text-gray-600 font-semibold mb-2">{month}</h3>
              <div className="space-y-2">
                {monthRecords.map(record => (
                  <div
                    key={record.id}
                    className="bg-white rounded-lg p-4 shadow-sm flex justify-between items-center cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`/add-record?id=${record.id}`)}
                  >
                    <div className="flex-1">
                      <div className="font-semibold">{record.category}</div>
                      <div className="text-sm text-gray-500">
                        {record.remark} · {record.date}
                      </div>
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        record.type === 'income' ? 'text-income' : 'text-expense'
                      }`}
                    >
                      {record.type === 'income' ? '+' : '-'}¥{record.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-2">
          <div className="flex justify-around items-center">
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-center py-2 text-primary"
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
            className="flex flex-col items-center py-2 text-gray-600"
          >
            <span>统计</span>
          </button>
        </div>
        </div>
      </div>

      <div className="h-20"></div>
    </div>
  );
};

export default Home;
