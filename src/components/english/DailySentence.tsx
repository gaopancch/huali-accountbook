import React from 'react';
import { DailySentence as DailySentenceType } from '../../types/english';

interface DailySentenceProps {
  sentence: DailySentenceType | null;
}

const DailySentence: React.FC<DailySentenceProps> = ({ sentence }) => {
  if (!sentence) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
        <p className="text-gray-500">暂无每日一句</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
      {/* 场景标签 */}
      {sentence.scene && (
        <div className="mb-4">
          <span className="bg-white bg-opacity-30 px-3 py-1 rounded-full text-sm">
            {sentence.scene}
          </span>
        </div>
      )}

      {/* 英文句子 */}
      <div className="mb-4">
        <div className="text-sm opacity-80 mb-2">Today's Sentence</div>
        <p className="text-2xl font-semibold leading-relaxed">
          {sentence.sentence}
        </p>
      </div>

      {/* 中文翻译 */}
      <div className="mb-4 pb-4 border-b border-white border-opacity-30">
        <div className="text-sm opacity-80 mb-2">翻译</div>
        <p className="text-lg opacity-90">{sentence.translation}</p>
      </div>

      {/* 关键词 */}
      {sentence.keywords && sentence.keywords.length > 0 && (
        <div>
          <div className="text-sm opacity-80 mb-2">关键词</div>
          <div className="flex flex-wrap gap-2">
            {sentence.keywords.map((keyword, index) => (
              <span
                key={index}
                className="bg-white bg-opacity-20 px-3 py-1 rounded-lg text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 装饰性引号 */}
      <div className="absolute top-4 right-4 text-6xl opacity-20">"</div>
    </div>
  );
};

export default DailySentence;
