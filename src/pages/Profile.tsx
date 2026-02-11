import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Book, DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES, Record } from '../types';
import { exportBookToExcel } from '../utils/exportExcel';
import { APP_VERSION } from '../version';
import CryptoJS from 'crypto-js';

const Profile: React.FC = () => {
  const { currentUser, userProfile, logout, updateUserProfile, setCurrentBook } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [newName, setNewName] = useState('');
  const [newBookName, setNewBookName] = useState('');

  useEffect(() => {
    loadBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadBooks = async () => {
    if (!currentUser) return;

    try {
      // Load all books where user is a member or owner
      // First get books where user is owner
      const { data: userOwnedBooks, error: ownedError } = await supabase
        .from('books')
        .select('*')
        .eq('owner_id', currentUser.uid);

      if (ownedError) throw ownedError;

      // Then get books where user is in members array
      const { data: userSharedBooks, error: sharedError } = await supabase
        .from('books')
        .select('*')
        .contains('members', [currentUser.uid]);

      if (sharedError) throw sharedError;

      // Combine and deduplicate
      const bookIds = new Set();
      const allBooksData = [...(userOwnedBooks || []), ...(userSharedBooks || [])].filter(book => {
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

      // Clean up duplicate default books - keep only one with records or the first one
      const ownedBooks = allBooks.filter(b => b.ownerId === currentUser.uid);
      const defaultBooks = ownedBooks.filter(b => b.isDefault);
      if (defaultBooks.length > 1) {
        // Check which default books have records
        const booksWithRecords = await Promise.all(
          defaultBooks.map(async (book) => {
            const { data: recordsData, error: recordsError } = await supabase
              .from('records')
              .select('id')
              .eq('book_id', book.id);

            if (recordsError) throw recordsError;
            return { book, hasRecords: (recordsData || []).length > 0 };
          })
        );

        // Find the default book to keep (one with records, or the first one)
        const bookToKeep = booksWithRecords.find(b => b.hasRecords)?.book || defaultBooks[0];

        // Delete other default books
        for (const { book } of booksWithRecords) {
          if (book.id !== bookToKeep.id) {
            // Delete all records in this book
            await supabase.from('records').delete().eq('book_id', book.id);
            // Delete the book
            await supabase.from('books').delete().eq('id', book.id);
          }
        }

        // Reload books after cleanup
        const { data: updatedOwnedBooks, error: updatedOwnedError } = await supabase
          .from('books')
          .select('*')
          .eq('owner_id', currentUser.uid);

        if (updatedOwnedError) throw updatedOwnedError;

        const { data: updatedSharedBooks, error: updatedSharedError } = await supabase
          .from('books')
          .select('*')
          .contains('members', [currentUser.uid]);

        if (updatedSharedError) throw updatedSharedError;

        const updatedBookIds = new Set();
        const updatedBooksData = [...(updatedOwnedBooks || []), ...(updatedSharedBooks || [])].filter(book => {
          if (updatedBookIds.has(book.id)) return false;
          updatedBookIds.add(book.id);
          return true;
        });

        const updatedBooks = (updatedBooksData || []).map(book => ({
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
        setBooks(updatedBooks);
      } else {
        setBooks(allBooks);
      }

      // Create default book if no owned books exist
      if (ownedBooks.length === 0 && allBooks.length === 0) {
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
      const displayName = userProfile.displayName || currentUser.displayName || '用户';

      const bookData = {
        name: `${displayName} 的默认账本`,
        owner_id: currentUser.uid,
        owner_name: displayName,
        members: [currentUser.uid], // 创建者默认是成员
        is_default: true,
        income_categories: DEFAULT_INCOME_CATEGORIES,
        expense_categories: DEFAULT_EXPENSE_CATEGORIES,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('books')
        .insert([bookData])
        .select()
        .single();

      if (error) throw error;

      // 设置新创建的默认账本为当前账本
      if (data && data.id) {
        await setCurrentBook(data.id);
      }
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
      const displayName = userProfile.displayName || currentUser.displayName || '用户';

      const bookData = {
        name: newBookName.trim(),
        owner_id: currentUser.uid,
        owner_name: displayName,
        members: [currentUser.uid], // 创建者默认是成员
        is_default: false,
        income_categories: DEFAULT_INCOME_CATEGORIES,
        expense_categories: DEFAULT_EXPENSE_CATEGORIES,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('books')
        .insert([bookData])
        .select()
        .single();

      if (error) throw error;

      setNewBookName('');
      setShowBookModal(false);
      await loadBooks();
      // 切换到新创建的账本
      if (data && data.id) {
        await handleSwitchBook(data.id);
      }
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
      // Delete all records in this book
      await supabase.from('records').delete().eq('book_id', bookId);

      // Delete book
      await supabase.from('books').delete().eq('id', bookId);

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

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      alert('请输入当前密码');
      return;
    }

    if (!newPassword.trim()) {
      alert('请输入新密码');
      return;
    }

    if (newPassword.length < 6) {
      alert('新密码长度至少为6个字符');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('两次输入的新密码不一致');
      return;
    }

    if (currentPassword === newPassword) {
      alert('新密码不能与当前密码相同');
      return;
    }

    try {
      if (!currentUser) return;

      // 1. 验证当前密码
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('uid', currentUser.uid)
        .single();

      if (userError || !userData) {
        alert('用户不存在');
        return;
      }

      const currentPasswordHash = CryptoJS.SHA256(currentPassword).toString();

      if (userData.password_hash !== currentPasswordHash) {
        alert('当前密码错误');
        return;
      }

      // 2. 更新密码
      const newPasswordHash = CryptoJS.SHA256(newPassword).toString();

      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: newPasswordHash })
        .eq('uid', currentUser.uid);

      if (updateError) throw updateError;

      alert('密码修改成功！');
      setShowChangePasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      alert('修改密码失败，请稍后再试');
    }
  };

  const handleDeleteAccount = async () => {
    // 验证密码
    if (!deletePassword.trim()) {
      alert('请输入密码');
      return;
    }

    try {
      if (!currentUser) return;

      // 1. 验证密码
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('uid', currentUser.uid)
        .single();

      if (userError || !userData) {
        alert('用户不存在');
        return;
      }

      const passwordHash = CryptoJS.SHA256(deletePassword).toString();

      if (userData.password_hash !== passwordHash) {
        alert('密码错误，请重新输入');
        setDeletePassword('');
        return;
      }

      // 显示处理中
      const loadingMsg = '正在删除账号数据...';
      console.log(loadingMsg);

      // 2. 删除用户拥有的所有账本
      const ownedBooks = books.filter(b => b.ownerId === currentUser.uid);

      for (const book of ownedBooks) {
        // 删除账本中的所有记录
        await supabase.from('records').delete().eq('book_id', book.id);

        // 删除账本
        await supabase.from('books').delete().eq('id', book.id);
      }

      // 3. 从共享账本中移除当前用户
      const sharedBooks = books.filter(b => b.ownerId !== currentUser.uid);
      for (const book of sharedBooks) {
        const updatedMembers = (book.members || []).filter(uid => uid !== currentUser.uid);
        await supabase
          .from('books')
          .update({ members: updatedMembers })
          .eq('id', book.id);
      }

      // 4. 删除用户资料
      await supabase
        .from('user_profiles')
        .delete()
        .eq('uid', currentUser.uid);

      // 5. 删除users集合中的认证记录
      await supabase
        .from('users')
        .delete()
        .eq('uid', currentUser.uid);
      console.log('✓ 已删除认证账号');

      // 6. 退出登录并跳转
      alert('账号已注销，所有数据已删除');
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('注销失败，请重试');
    }
  };

  const handleSwitchBook = async (bookId: string) => {
    try {
      console.log('Profile: Switching to book:', bookId);
      await setCurrentBook(bookId);
      console.log('Profile: Book switched successfully');
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
      const { data: recordsData, error } = await supabase
        .from('records')
        .select('*')
        .eq('book_id', currentBook.id);

      if (error) throw error;

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
      } as Record));

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
            className="w-full p-4 text-left hover:bg-gray-50 flex justify-between items-center border-b"
          >
            <span>修改昵称</span>
            <span className="text-gray-400">→</span>
          </button>
          <button
            onClick={() => setShowChangePasswordModal(true)}
            className="w-full p-4 text-left hover:bg-gray-50 flex justify-between items-center"
          >
            <span>修改密码</span>
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
          className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 mb-3"
        >
          退出登录
        </button>

        {/* Delete Account */}
        <button
          onClick={() => setShowDeleteAccountModal(true)}
          className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900"
        >
          注销账号
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

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">修改密码</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">当前密码</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="输入当前密码"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">新密码</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="至少6个字符"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">确认新密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="再次输入新密码"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="flex-1 py-2 border border-gray-300 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 py-2 bg-primary text-white rounded-lg"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-red-600">⚠️ 注销账号</h3>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800 font-semibold mb-2">此操作无法撤销！将会：</p>
              <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                <li>删除你创建的所有账本（{books.filter(b => b.ownerId === currentUser?.uid).length} 个）</li>
                <li>删除所有账本中的记录</li>
                <li>从共享账本中移除你的访问权限</li>
                <li>删除你的用户资料</li>
                <li>删除你的登录账号（无法再使用此邮箱和密码登录）</li>
              </ul>
            </div>

            <p className="text-sm text-gray-700 mb-2">
              请输入你的<span className="font-bold text-red-600">登录密码</span>以确认注销：
            </p>

            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-red-500"
              placeholder="输入登录密码"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteAccountModal(false);
                  setDeletePassword('');
                }}
                className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={!deletePassword.trim()}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                确认注销
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
