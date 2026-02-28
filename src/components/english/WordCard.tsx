import React, { useState } from 'react';
import { WordWithProgress } from '../../types/english';

interface WordCardProps {
  word: WordWithProgress;
  onMastered: (wordId: string) => void;
  onToggleFavorite: (wordId: string, isFavorite: boolean) => void;
}

const WordCard: React.FC<WordCardProps> = ({ word, onMastered, onToggleFavorite }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const isFavorite = word.progress?.isFavorite || false;
  const isMastered = word.progress?.status === 'mastered';

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleMastered = (e: React.MouseEvent) => {
    e.stopPropagation();

    // 触发飞出动画
    setIsFlying(true);

    // 动画完成后再调用回调移除卡片
    setTimeout(() => {
      onMastered(word.id);
    }, 600); // 600ms 后移除（与动画时长一致）
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(word.id, !isFavorite);
  };

  return (
    <div
      className={`perspective-1000 h-64 mb-4 transition-all duration-600 ${
        isFlying ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        transform: isFlying ? 'translateY(-150%) scale(0.8) rotateZ(10deg)' : 'translateY(0) scale(1) rotateZ(0)',
        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d cursor-pointer ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={handleFlip}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* 卡片正面 */}
        <div
          className="absolute w-full h-full backface-hidden bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 flex flex-col justify-between text-white"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="flex justify-between items-start">
            <div>
              {word.level && (
                <span className="text-xs bg-white bg-opacity-30 px-2 py-1 rounded-full">
                  {word.level}
                </span>
              )}
              {word.category && (
                <span className="text-xs bg-white bg-opacity-30 px-2 py-1 rounded-full ml-2">
                  {word.category}
                </span>
              )}
            </div>
            <button
              onClick={handleToggleFavorite}
              className="text-2xl hover:scale-110 transition-transform"
            >
              {isFavorite ? '❤️' : '🤍'}
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center">
            <h2 className="text-4xl font-bold mb-2">{word.word}</h2>
            {word.phonetic && (
              <p className="text-lg opacity-90">{word.phonetic}</p>
            )}
          </div>

          <div className="text-center text-sm opacity-80">
            点击查看释义 👆
          </div>
        </div>

        {/* 卡片背面 */}
        <div
          className="absolute w-full h-full backface-hidden bg-white rounded-2xl shadow-lg p-6 flex flex-col"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="flex-1 overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-800 mb-2">{word.word}</h3>
              {word.phonetic && (
                <p className="text-gray-600 text-sm mb-3">{word.phonetic}</p>
              )}
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">释义</p>
              <p className="text-gray-800 font-medium">{word.definition}</p>
            </div>

            {word.example && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">例句</p>
                <p className="text-gray-700 italic">{word.example}</p>
              </div>
            )}

            {word.translation && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">翻译</p>
                <p className="text-gray-600">{word.translation}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleToggleFavorite}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                isFavorite
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isFavorite ? '❤️ 已收藏' : '🤍 收藏'}
            </button>
            <button
              onClick={handleMastered}
              disabled={isMastered}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                isMastered
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isMastered ? '✅ 已掌握' : '✅ 掌握了'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordCard;
