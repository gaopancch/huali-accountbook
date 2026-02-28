// 英语学习模块类型定义

// 单词类型
export interface EnglishWord {
  id: string;
  word: string;
  phonetic?: string;
  definition: string;
  example?: string;
  translation?: string;
  level?: string; // A1, A2, B1, B2, C1, C2
  category?: string; // 日常用语, 职场, 旅行, 餐饮等
  createdAt: Date;
}

// 每日一句类型
export interface DailySentence {
  id: string;
  sentence: string;
  translation: string;
  keywords?: string[]; // 重点词汇
  scene?: string; // 使用场景
  createdAt: Date;
}

// 用户单词进度类型
export interface UserWordProgress {
  id: string;
  userId: string;
  wordId: string;
  status: 'learning' | 'mastered'; // 学习中 | 已掌握
  isFavorite: boolean; // 是否收藏
  learnedDate: Date; // 学习日期
  reviewCount: number; // 复习次数
  createdAt: Date;
  updatedAt: Date;
}

// 学习日志类型
export interface StudyLog {
  id: string;
  userId: string;
  studyDate: Date; // 学习日期
  wordsLearned: number; // 学习的单词数
  studyDuration: number; // 学习时长（分钟）
  createdAt: Date;
}

// 学习统计类型
export interface StudyStats {
  streakDays: number; // 连续打卡天数
  totalWordsLearned: number; // 累计学习单词数
  masteredWords: number; // 已掌握单词数
  favoriteWords: number; // 收藏的单词数
  totalStudyTime: number; // 总学习时长（分钟）
  studyCalendar: { [date: string]: number }; // 学习日历 { '2024-01-01': 10 }
}

// 带进度的单词类型（用于显示）
export interface WordWithProgress extends EnglishWord {
  progress?: UserWordProgress;
}
