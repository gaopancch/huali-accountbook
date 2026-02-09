import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Book, DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES, Record } from '../types';
import { exportBookToExcel } from '../utils/exportExcel';
import { APP_VERSION } from '../version';

const Profile: React.FC = () => {
  const { currentUser, userProfile, logout, updateUserProfile, setCurrentBook } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [newName, setNewName] = useState('');
  const [newBookName, setNewBookName] = useState('');

  useEffect(() => {
    loadBooks();
  }, [currentUser]);

  const loadBooks = async () => {
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
      let allBooks = [...ownedBooks, ...sharedBooks];

      // Clean up duplicate default books - keep only one with records or the first one
      const defaultBooks = ownedBooks.filter(b => b.isDefault);
      if (defaultBooks.length > 1) {
        // Check which default books have records
        const booksWithRecords = await Promise.all(
          defaultBooks.map(async (book) => {
            const recordsQuery = query(collection(db, 'records'), where('bookId', '==', book.id));
            const recordsSnapshot = await getDocs(recordsQuery);
            return { book, hasRecords: recordsSnapshot.size > 0 };
          })
        );

        // Find the default book to keep (one with records, or the first one)
        const bookToKeep = booksWithRecords.find(b => b.hasRecords)?.book || defaultBooks[0];

        // Delete other default books
        for (const { book } of booksWithRecords) {
          if (book.id !== bookToKeep.id) {
            await deleteDoc(doc(db, 'books', book.id));
            // Also delete any records in this book
            const recordsQuery = query(collection(db, 'records'), where('bookId', '==', book.id));
            const recordsSnapshot = await getDocs(recordsQuery);
            await Promise.all(recordsSnapshot.docs.map(d => deleteDoc(d.ref)));
          }
        }

        // Reload books after cleanup
        const updatedBooksQuery = query(collection(db, 'books'), where('ownerId', '==', currentUser.uid));
        const updatedBooksSnapshot = await getDocs(updatedBooksQuery);
        const updatedOwnedBooks = updatedBooksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
        allBooks = [...updatedOwnedBooks, ...sharedBooks];
      }

      setBooks(allBooks);

      // Create default book if no owned books exist
      if (ownedBooks.length === 0) {
        await createDefaultBook();
        return; // createDefaultBook will set the current book
      }

      // Auto-select a book if user doesn't have one selected
      if (!userProfile?.currentBookId && allBooks.length > 0) {
        const defaultBook = allBooks.find(b => b.isDefault && b.ownerId === currentUser.uid) || allBooks[0];
        await setCurrentBook(defaultBook.id);
      }
    } catch (error) {
      console.error('Error loading books:', error);
    }
  };

  const createDefaultBook = async () => {
    if (!currentUser || !userProfile) return;

    try {
      const book: Omit<Book, 'id'> = {
        name: `${userProfile.displayName} 的默认账本`,
        ownerId: currentUser.uid,
        ownerName: userProfile.displayName,
        isDefault: true,
        incomeCategories: DEFAULT_INCOME_CATEGORIES,
        expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'books'), book);
      // 设置新创建的默认账本为当前账本
      await setCurrentBook(docRef.id);
      await loadBooks();
    } catch (error) {
      console.error('Error creating default book:', error);
    }
  };

  const handleCreateBook = async () => {
    if (!currentUser || !userProfile || !newBookName.trim()) {
      alert('请输入账本名称');
      return;
    }

    try {
      const book: Omit<Book, 'id'> = {
        name: newBookName.trim(),
        ownerId: currentUser.uid,
        ownerName: userProfile.displayName,
        isDefault: false,
        incomeCategories: DEFAULT_INCOME_CATEGORIES,
        expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'books'), book);
      setNewBookName('');
      setShowBookModal(false);
      await loadBooks();
      // 切换到新创建的账本
      await handleSwitchBook(docRef.id);
      alert('账本创建成功!');
    } catch (error) {
      console.error('Error creating book:', error);
      alert('创建失败');
    }
  };

  const handleDeleteBook = async (bookId: string, isDefault: boolean) => {
    // Ensure at least one book remains
    if (books.length <= 1) {
      alert('至少需要保留一个账本');
      return;
    }

    if (!window.confirm('确定要删除这个账本吗? 所有记录也会被删除。')) {
      return;
    }

    try {
      // Delete book
      await deleteDoc(doc(db, 'books', bookId));

      // Delete all records in this book
      const recordsQuery = query(collection(db, 'records'), where('bookId', '==', bookId));
      const recordsSnapshot = await getDocs(recordsQuery);
      await Promise.all(recordsSnapshot.docs.map(doc => deleteDoc(doc.ref)));

      // If the deleted book was the current book, switch to another book
      if (userProfile?.currentBookId === bookId) {
        const remainingBooks = books.filter(b => b.id !== bookId);
        if (remainingBooks.length > 0) {
          await setCurrentBook(remainingBooks[0].id);
        }
      }

      await loadBooks();
      alert('账本已删除');
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('删除失败');
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      alert('请输入昵称');
      return;
    }

    try {
      await updateUserProfile(newName.trim());
      setShowNameModal(false);
      setNewName('');
      alert('昵称更新成功!');
    } catch (error) {
      console.error('Error updating name:', error);
      alert('更新失败');
    }
  };

  const handleLogout = async () => {
    if (window.confirm('确定要退出登录吗?')) {
      try {
        await logout();
        navigate('/login');
      } catch (error) {
        console.error('Error logging out:', error);
        alert('退出失败');
      }
    }
  };

  const handleSwitchBook = async (bookId: string) => {
    try {
      await setCurrentBook(bookId);
      alert('账本切换成功!');
    } catch (error) {
      console.error('Error switching book:', error);
      alert('切换失败');
    }
  };

  const handleShareCurrentBook = () => {
    if (!userProfile?.currentBookId) {
      alert('请先选择要共享的账本');
      return;
    }

    const currentBook = books.find(b => b.id === userProfile.currentBookId);
    if (!currentBook) {
      alert('未找到当前账本');
      return;
    }

    // Generate share link
    const link = `${window.location.origin}/share/${currentBook.id}`;
    setShareLink(link);
    setShowShareModal(true);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert('链接已复制到剪贴板!');
  };

  const handleExportCurrentBook = async () => {
    if (!userProfile?.currentBookId) {
      alert('请先选择要导出的账本');
      return;
    }

    const currentBook = books.find(b => b.id === userProfile.currentBookId);
    if (!currentBook) {
      alert('未找到当前账本');
      return;
    }

    try {
      // 查询当前账本的所有记录
      const recordsQuery = query(collection(db, 'records'), where('bookId', '==', currentBook.id));
      const recordsSnapshot = await getDocs(recordsQuery);
      const records = recordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Record));

      if (records.length === 0) {
        alert('当前账本暂无记录');
        return;
      }

      // 按日期排序（降序）
      records.sort((a, b) => b.date.localeCompare(a.date));

      // 导出Excel
      exportBookToExcel(records, currentBook.name);
      alert('导出成功!');
    } catch (error) {
      console.error('Error exporting book:', error);
      alert('导出失败');
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-green-600 text-white p-6 rounded-b-3xl shadow-lg">
        <button onClick={() => navigate('/')} className="text-white mb-4">
          ← 返回
        </button>
        <div className="flex items-center">
          <div className="w-16 h-16 bg-white bg-opacity-30 rounded-full flex items-center justify-center text-2xl mr-4">
            {userProfile?.displayName?.charAt(0) || '用'}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{userProfile?.displayName}</h2>
            <p className="text-sm opacity-80">{userProfile?.email}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* User Settings */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <h3 className="font-bold p-4 border-b">用户设置</h3>
          <button
            onClick={() => {
              setNewName(userProfile?.displayName || '');
              setShowNameModal(true);
            }}
            className="w-full p-4 text-left hover:bg-gray-50 flex justify-between items-center"
          >
            <span>修改昵称</span>
            <span className="text-gray-400">→</span>
          </button>
        </div>

        {/* Book Management */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="font-bold">我的账本</h3>
            <button
              onClick={() => setShowBookModal(true)}
              className="bg-primary text-white px-4 py-1 rounded-full text-sm"
            >
              + 创建账本
            </button>
          </div>

          <div className="divide-y">
            {books.map(book => (
              <div key={book.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => handleSwitchBook(book.id)}
                >
                  <div className="flex items-center">
                    <div className="font-semibold">{book.name}</div>
                    {userProfile?.currentBookId === book.id && (
                      <span className="ml-2 text-xs bg-primary text-white px-2 py-1 rounded">当前</span>
                    )}
                    {book.ownerId !== currentUser?.uid && (
                      <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">共享</span>
                    )}
                  </div>
                  {book.isDefault && book.ownerId === currentUser?.uid && (
                    <span className="text-xs text-gray-500">默认账本</span>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteBook(book.id, book.isDefault);
                  }}
                  className="text-red-500 text-sm"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Share Book */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <h3 className="font-bold p-4 border-b">账本共享</h3>
          <button
            onClick={handleShareCurrentBook}
            className="w-full p-4 text-left hover:bg-gray-50 flex justify-between items-center border-b"
          >
            <div>
              <div>分享当前账本</div>
              <div className="text-xs text-gray-500 mt-1">生成链接邀请他人查看和管理账本</div>
            </div>
            <span className="text-gray-400">→</span>
          </button>
          <button
            onClick={handleExportCurrentBook}
            className="w-full p-4 text-left hover:bg-gray-50 flex justify-between items-center"
          >
            <div>
              <div>导出当前账本</div>
              <div className="text-xs text-gray-500 mt-1">将账本数据导出为Excel文件</div>
            </div>
            <span className="text-gray-400">→</span>
          </button>
        </div>

        {/* Version Info */}
        <div className="text-center text-gray-500 text-sm mb-4">
          版本 {APP_VERSION}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600"
        >
          退出登录
        </button>
      </div>

      {/* Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">修改昵称</h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4"
              placeholder="输入新昵称"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowNameModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleUpdateName}
                className="flex-1 py-2 bg-primary text-white rounded-lg"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book Modal */}
      {showBookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">创建账本</h3>
            <input
              type="text"
              value={newBookName}
              onChange={(e) => setNewBookName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4"
              placeholder="输入账本名称"
              maxLength={20}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowBookModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleCreateBook}
                className="flex-1 py-2 bg-primary text-white rounded-lg"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">分享账本</h3>
            <p className="text-sm text-gray-600 mb-4">
              复制以下链接发送给你的朋友，他们点击链接后可以选择接受共享，共享后可以一起管理这个账本。
            </p>
            <div className="bg-gray-100 p-3 rounded-lg mb-4 break-all text-sm">
              {shareLink}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg"
              >
                关闭
              </button>
              <button
                onClick={copyShareLink}
                className="flex-1 py-2 bg-primary text-white rounded-lg"
              >
                复制链接
              </button>
            </div>
          </div>
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
            className="flex flex-col items-center py-2 text-gray-600"
          >
            <span>统计</span>
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
