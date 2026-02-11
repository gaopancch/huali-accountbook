import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Book, DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES, Record as RecordType } from '../types';

const AddRecord: React.FC = () => {
  const { currentUser, userProfile, setCurrentBook } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recordId = searchParams.get('id');

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [remark, setRemark] = useState('');
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const categories = type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;

  useEffect(() => {
    loadCurrentBook();
    if (recordId) {
      loadRecord(recordId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, userProfile?.currentBookId, recordId]);

  const loadCurrentBook = async () => {
    if (!currentUser) return;

    try {
      console.log('AddRecord: Loading current book for user:', currentUser.uid);
      console.log('AddRecord: User selected bookId:', userProfile?.currentBookId);

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
        incomeCategories: book.income_categories || DEFAULT_INCOME_CATEGORIES,
        expenseCategories: book.expense_categories || DEFAULT_EXPENSE_CATEGORIES,
        createdAt: new Date(book.created_at),
        updatedAt: new Date(book.updated_at),
      } as Book));

      console.log('AddRecord: Found books:', allBooks.length);
      console.log('AddRecord: Books:', allBooks.map(b => ({ id: b.id, name: b.name, ownerId: b.ownerId, members: b.members })));

      // If no books exist, create a default book
      if (allBooks.length === 0) {
        console.log('AddRecord: No books found, creating default book...');
        await createDefaultBook();
        return; // createDefaultBook will call loadCurrentBook again
      }

      let selectedBook = null;
      if (userProfile?.currentBookId) {
        selectedBook = allBooks.find(b => b.id === userProfile.currentBookId);
        console.log('AddRecord: Found selected book by ID:', selectedBook);
      }
      if (!selectedBook) {
        selectedBook = allBooks.find(b => b.isDefault && b.ownerId === currentUser.uid) || allBooks[0];
        console.log('AddRecord: Using fallback book:', selectedBook);
      }

      if (selectedBook) {
        console.log('AddRecord: Setting current book:', { id: selectedBook.id, name: selectedBook.name });
      } else {
        console.error('AddRecord: No book found!');
      }

      setCurrentBook(selectedBook);
      setCategory(categories[0]);
    } catch (error) {
      console.error('Error loading book:', error);
    }
  };

  const createDefaultBook = async () => {
    if (!currentUser || !userProfile) return;

    try {
      const displayName = userProfile.displayName || currentUser.displayName || '用户';

      const bookData = {
        name: `${displayName} 的默认账本`,
        owner_id: currentUser.uid,
        owner_name: displayName,
        members: [currentUser.uid],
        is_default: true,
        income_categories: DEFAULT_INCOME_CATEGORIES,
        expense_categories: DEFAULT_EXPENSE_CATEGORIES,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('AddRecord: Creating default book:', bookData);
      const { data, error } = await supabase
        .from('books')
        .insert([bookData])
        .select()
        .single();

      if (error) throw error;

      console.log('AddRecord: Default book created:', data);

      // Set the new default book as current book
      if (data && data.id) {
        await setCurrentBook(data.id);
      }

      // Reload books to update state
      await loadCurrentBook();
    } catch (error) {
      console.error('Error creating default book:', error);
    }
  };

  const loadRecord = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        const recordData: RecordType = {
          id: data.id,
          bookId: data.book_id,
          type: data.type,
          category: data.category,
          amount: data.amount,
          remark: data.remark || '',
          date: data.date,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        setType(recordData.type);
        setCategory(recordData.category);
        setAmount(recordData.amount.toString());
        setDate(recordData.date);
        setRemark(recordData.remark || '');
        setIsEditMode(true);
      } else {
        alert('记录不存在');
        navigate('/');
      }
    } catch (error) {
      console.error('Error loading record:', error);
      alert('加载记录失败');
      navigate('/');
    }
  };

  useEffect(() => {
    setCategory(categories[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = parseFloat(amount);

    if (!currentBook) {
      alert('账本加载中，请稍后再试');
      return;
    }

    if (!category) {
      alert('请选择分类');
      return;
    }

    if (!amount || amount.trim() === '') {
      alert('请输入金额');
      return;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      alert('金额必须大于0');
      return;
    }

    if (remark.length > 25) {
      alert('备注最多25个字符');
      return;
    }

    try {
      setLoading(true);

      if (isEditMode && recordId) {
        console.log('AddRecord: Updating record:', recordId);
        const { error } = await supabase
          .from('records')
          .update({
            type,
            category,
            amount: numAmount,
            remark,
            date,
            updated_at: new Date().toISOString(),
          })
          .eq('id', recordId);

        if (error) throw error;
        console.log('AddRecord: Record updated successfully');
        alert('更新成功!');
      } else {
        const recordData = {
          book_id: currentBook.id,
          type,
          category,
          amount: numAmount,
          remark,
          date,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        console.log('AddRecord: Creating new record:', recordData);
        const { data, error } = await supabase
          .from('records')
          .insert([recordData])
          .select()
          .single();

        if (error) throw error;
        console.log('AddRecord: Record created successfully, result:', data);
        alert('记账成功!');
      }

      navigate('/');
    } catch (error) {
      console.error('Error saving record:', error);
      alert(isEditMode ? '更新失败，请重试' : '记账失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!recordId) return;

    if (!window.confirm('确定要删除这条记录吗?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('records')
        .delete()
        .eq('id', recordId);

      if (error) throw error;
      alert('删除成功!');
      navigate('/');
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('删除失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center">
        <button onClick={() => navigate('/')} className="text-gray-600 mr-4">
          ← 返回
        </button>
        <h1 className="text-xl font-bold">{isEditMode ? '编辑记录' : '记账'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4">
        {/* Type Selection */}
        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2 rounded-lg font-semibold ${
                type === 'expense'
                  ? 'bg-expense text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              支出
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2 rounded-lg font-semibold ${
                type === 'income'
                  ? 'bg-income text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              收入
            </button>
          </div>

          {/* Category Selection */}
          <div className="grid grid-cols-4 gap-3">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`py-3 rounded-lg text-sm ${
                  category === cat
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div className="bg-white rounded-lg p-6 mb-4 shadow-sm">
          <label className="block text-sm text-gray-600 mb-2">金额</label>
          <div className="flex items-center">
            <span className="text-3xl mr-2">¥</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="text-3xl font-bold flex-1 outline-none border-b-2 border-gray-200 focus:border-primary"
            />
          </div>
        </div>

        {/* Date Input */}
        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <label className="block text-sm text-gray-600 mb-2">日期</label>
          <input
            type="date"
            value={date}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Remark Input */}
        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <label className="block text-sm text-gray-600 mb-2">备注 (可选)</label>
          <input
            type="text"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            maxLength={25}
            placeholder="添加备注信息..."
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
          <div className="text-right text-xs text-gray-400 mt-1">
            {remark.length}/25
          </div>
        </div>

        {/* Submit Button */}
        {isEditMode ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 bg-red-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? '删除中...' : '删除'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white py-4 rounded-lg font-bold text-lg hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-lg font-bold text-lg hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? '保存中...' : '保存'}
          </button>
        )}
      </form>
    </div>
  );
};

export default AddRecord;
