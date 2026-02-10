import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Book } from '../types';

const ShareBook: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadBook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  const loadBook = async () => {
    if (!bookId) {
      setError('无效的分享链接');
      setLoading(false);
      return;
    }

    try {
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single();

      if (bookError || !bookData) {
        setError('账本不存在');
        setLoading(false);
        return;
      }

      const book: Book = {
        id: bookData.id,
        name: bookData.name,
        ownerId: bookData.owner_id,
        ownerName: bookData.owner_name,
        members: bookData.members || [],
        isDefault: bookData.is_default,
        incomeCategories: bookData.income_categories,
        expenseCategories: bookData.expense_categories,
        createdAt: new Date(bookData.created_at),
        updatedAt: new Date(bookData.updated_at),
      };
      setBook(book);

      // Check if user is already the owner or has access
      if (currentUser) {
        if (book.ownerId === currentUser.uid) {
          setError('这是你自己的账本');
        } else if (book.members?.includes(currentUser.uid)) {
          setError('你已经可以访问这个账本了');
        }
      }
    } catch (err) {
      console.error('Error loading book:', err);
      setError('加载失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!currentUser || !userProfile) {
      // Redirect to login
      navigate('/login', { state: { returnTo: `/share/${bookId}` } });
      return;
    }

    if (!book) return;

    try {
      setProcessing(true);

      console.log('=== Debug Info ===');
      console.log('Current User ID:', currentUser.uid);
      console.log('Current User Email:', currentUser.email);
      console.log('Book ID:', book.id);
      console.log('Book Owner ID:', book.ownerId);
      console.log('Book members:', book.members);

      // Add current user to the book's members list
      // First, ensure members array exists and contains the owner
      const currentMembers = book.members || [book.ownerId];

      console.log('Attempting to update with:', [...currentMembers, currentUser.uid]);

      const { error } = await supabase
        .from('books')
        .update({
          members: [...currentMembers, currentUser.uid],
        })
        .eq('id', book.id);

      if (error) throw error;

      alert('成功接受共享! 现在你可以管理这个账本了。');
      // 强制刷新页面以加载新的共享账本
      window.location.href = '/profile';
    } catch (err: any) {
      console.error('Error accepting share:', err);
      console.error('Error message:', err.message);
      console.error('Full error:', JSON.stringify(err, null, 2));

      alert('接受失败: ' + (err.message || '请重试'));
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">无法接受分享</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-green-600"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-blue-500 px-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">📒</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">账本共享邀请</h1>
          <p className="text-gray-600">
            {book?.ownerName} 邀请你一起管理账本
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-800">{book?.name}</div>
            <div className="text-sm text-gray-500 mt-1">创建者: {book?.ownerName}</div>
          </div>
        </div>

        {!currentUser ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              你需要先登录或注册才能接受共享。点击"接受"将跳转到登录页面。
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              接受后，你将可以查看和管理这个账本的所有记录。
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleReject}
            className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
          >
            拒绝
          </button>
          <button
            onClick={handleAccept}
            disabled={processing}
            className="flex-1 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50"
          >
            {processing ? '处理中...' : '接受'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareBook;
