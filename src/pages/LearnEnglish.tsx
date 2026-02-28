import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getTodayWords,
  getTodaySentence,
  markWordAsMastered,
  toggleWordFavorite,
  getStudyStats,
} from '../services/englishAPI';
import { WordWithProgress, DailySentence, StudyStats } from '../types/english';
import WordCard from '../components/english/WordCard';
import DailySentenceComponent from '../components/english/DailySentence';
import LearningStats from '../components/english/LearningStats';
import StudyCalendar from '../components/english/StudyCalendar';

type TabType = 'words' | 'sentence' | 'stats';

const LearnEnglish: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('words');
  const [words, setWords] = useState<WordWithProgress[]>([]);
  const [sentence, setSentence] = useState<DailySentence | null>(null);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [masteredCount, setMasteredCount] = useState(0);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // 并行加载所有数据
      const [wordsData, sentenceData, statsData] = await Promise.all([
        getTodayWords(currentUser.uid),
        getTodaySentence(),
        getStudyStats(currentUser.uid),
      ]);

      setWords(wordsData);
      setSentence(sentenceData);
      setStats(statsData);

      // 计算已掌握的单词数
      const mastered = wordsData.filter((w) => w.progress?.status === 'mastered').length;
      setMasteredCount(mastered);
    } catch (error) {
      console.error('Error loading English learning data:', error);
      alert('加载数据失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const handleMastered = async (wordId: string) => {
    if (!currentUser) return;

    try {
      await markWordAsMastered(currentUser.uid, wordId);

      // 更新本地状态
      setWords((prevWords) =>
        prevWords.map((word) =>
          word.id === wordId
            ? {
                ...word,
                progress: {
                  ...word.progress!,
                  status: 'mastered',
                  reviewCount: (word.progress?.reviewCount || 0) + 1,
                  updatedAt: new Date(),
                },
              }
            : word
        )
      );

      setMasteredCount((prev) => prev + 1);

      // 重新加载统计数据
      const statsData = await getStudyStats(currentUser.uid);
      setStats(statsData);

      // 检查是否完成所有单词
      if (masteredCount + 1 === words.length) {
        setTimeout(() => {
          alert('🎉 恭喜！你已经掌握了今天的所有单词！');
        }, 300);
      }
    } catch (error) {
      console.error('Error marking word as mastered:', error);
      alert('操作失败，请稍后再试');
    }
  };

  const handleToggleFavorite = async (wordId: string, isFavorite: boolean) => {
    if (!currentUser) return;

    try {
      await toggleWordFavorite(currentUser.uid, wordId, isFavorite);

      // 更新本地状态
      setWords((prevWords) =>
        prevWords.map((word) =>
          word.id === wordId
            ? {
                ...word,
                progress: {
                  id: word.progress?.id || '',
                  userId: currentUser.uid,
                  wordId: word.id,
                  status: word.progress?.status || 'learning',
                  isFavorite,
                  learnedDate: word.progress?.learnedDate || new Date(),
                  reviewCount: word.progress?.reviewCount || 0,
                  createdAt: word.progress?.createdAt || new Date(),
                  updatedAt: new Date(),
                },
              }
            : word
        )
      );

      // 重新加载统计数据
      const statsData = await getStudyStats(currentUser.uid);
      setStats(statsData);
    } catch (error) {
      console.error('Error toggling word favorite:', error);
      alert('操作失败，请稍后再试');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  // 筛选未掌握的单词
  const unfinishedWords = words.filter((w) => w.progress?.status !== 'mastered');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-b-3xl shadow-lg">
        <button onClick={() => navigate('/profile')} className="text-white mb-4">
          ← 返回
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Learn English</h1>
            <p className="text-sm opacity-90">每天进步一点点</p>
          </div>
          <div className="text-4xl">📚</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-around">
            <button
              onClick={() => setActiveTab('words')}
              className={`flex-1 py-4 text-center font-semibold transition-colors relative ${
                activeTab === 'words'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              今日单词
              {activeTab === 'words' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('sentence')}
              className={`flex-1 py-4 text-center font-semibold transition-colors relative ${
                activeTab === 'sentence'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              每日一句
              {activeTab === 'sentence' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-4 text-center font-semibold transition-colors relative ${
                activeTab === 'stats'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              学习统计
              {activeTab === 'stats' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4">
        {/* 今日单词 Tab */}
        {activeTab === 'words' && (
          <div>
            {/* 进度条 */}
            <div className="mb-6 bg-white rounded-2xl shadow-sm p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">今日进度</span>
                <span className="text-sm font-bold text-blue-600">
                  {masteredCount} / {words.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${words.length > 0 ? (masteredCount / words.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* 单词卡片列表 */}
            {unfinishedWords.length > 0 ? (
              <div>
                {unfinishedWords.map((word) => (
                  <WordCard
                    key={word.id}
                    word={word}
                    onMastered={handleMastered}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">太棒了！</h3>
                <p className="text-gray-600">你已经完成今天所有单词的学习！</p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-shadow"
                >
                  返回首页
                </button>
              </div>
            )}
          </div>
        )}

        {/* 每日一句 Tab */}
        {activeTab === 'sentence' && (
          <div>
            <DailySentenceComponent sentence={sentence} />
          </div>
        )}

        {/* 学习统计 Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <LearningStats stats={stats} />
            {stats && <StudyCalendar studyData={stats.studyCalendar} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnEnglish;
