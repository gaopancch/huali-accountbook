import React from 'react';
import { StudyStats } from '../../types/english';

interface LearningStatsProps {
  stats: StudyStats | null;
}

const LearningStats: React.FC<LearningStatsProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
        <p className="text-gray-500">加载统计数据中...</p>
      </div>
    );
  }

  const statCards = [
    {
      icon: '🔥',
      label: '连续打卡',
      value: stats.streakDays,
      unit: '天',
      color: 'from-orange-400 to-red-500',
    },
    {
      icon: '📚',
      label: '累计学习',
      value: stats.totalWordsLearned,
      unit: '词',
      color: 'from-blue-400 to-indigo-500',
    },
    {
      icon: '✅',
      label: '已掌握',
      value: stats.masteredWords,
      unit: '词',
      color: 'from-green-400 to-emerald-500',
    },
    {
      icon: '❤️',
      label: '收藏',
      value: stats.favoriteWords,
      unit: '词',
      color: 'from-pink-400 to-rose-500',
    },
  ];

  return (
    <div className="space-y-4">
      {/* 统计卡片网格 */}
      <div className="grid grid-cols-2 gap-4">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br ${card.color} rounded-2xl shadow-lg p-4 text-white`}
          >
            <div className="text-3xl mb-2">{card.icon}</div>
            <div className="text-2xl font-bold mb-1">
              {card.value}
              <span className="text-sm font-normal ml-1">{card.unit}</span>
            </div>
            <div className="text-sm opacity-90">{card.label}</div>
          </div>
        ))}
      </div>

      {/* 学习进度条 */}
      {stats.totalWordsLearned > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-gray-700">掌握率</span>
            <span className="text-sm font-bold text-green-600">
              {Math.round((stats.masteredWords / stats.totalWordsLearned) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-400 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${(stats.masteredWords / stats.totalWordsLearned) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>已掌握 {stats.masteredWords} 词</span>
            <span>共 {stats.totalWordsLearned} 词</span>
          </div>
        </div>
      )}

      {/* 鼓励语 */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg p-6 text-white text-center">
        <p className="text-lg font-semibold mb-2">
          {stats.streakDays === 0 && '开始你的学习之旅吧！'}
          {stats.streakDays > 0 && stats.streakDays < 7 && '加油！保持学习势头！'}
          {stats.streakDays >= 7 && stats.streakDays < 30 && '太棒了！你已经坚持了一周以上！'}
          {stats.streakDays >= 30 && '惊人！你是学习的榜样！'}
        </p>
        <p className="text-sm opacity-90">
          {stats.masteredWords === 0 && '每天学一点，进步看得见'}
          {stats.masteredWords > 0 && stats.masteredWords < 50 && '继续努力，你会越来越好！'}
          {stats.masteredWords >= 50 && stats.masteredWords < 200 && '你的词汇量正在快速增长！'}
          {stats.masteredWords >= 200 && '你已经掌握了大量词汇！'}
        </p>
      </div>
    </div>
  );
};

export default LearningStats;
