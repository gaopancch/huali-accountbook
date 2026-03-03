import { supabase } from '../supabase';
import {
  EnglishWord,
  DailySentence,
  UserWordProgress,
  StudyLog,
  StudyStats,
  WordWithProgress,
} from '../types/english';
import * as cloudflareAI from './cloudflareAI';

/**
 * 获取今日5个固定的数据库单词
 * 策略：从数据库中按等级顺序返回5个未掌握的单词
 */
export const getTodayWords = async (userId: string): Promise<WordWithProgress[]> => {
  try {
    // 1. 获取用户已掌握的单词ID列表
    const { data: masteredData, error: masteredError } = await supabase
      .from('user_word_progress')
      .select('word_id')
      .eq('user_id', userId)
      .eq('status', 'mastered');

    if (masteredError) throw masteredError;

    const masteredWordIds = masteredData?.map((item) => item.word_id) || [];

    // 2. 获取用户今天已学习但未掌握的单词
    const today = new Date().toISOString().split('T')[0];
    const { data: todayProgressData, error: todayProgressError } = await supabase
      .from('user_word_progress')
      .select('word_id')
      .eq('user_id', userId)
      .eq('learned_date', today);

    if (todayProgressError) throw todayProgressError;

    const todayWordIds = todayProgressData?.map((item) => item.word_id) || [];

    // 3. 如果今天已学习的单词不足5个，从单词库中选择新单词补充
    let query = supabase
      .from('english_words')
      .select('*')
      .order('level', { ascending: true });

    // 排除已掌握的单词
    if (masteredWordIds.length > 0) {
      query = query.not('id', 'in', `(${masteredWordIds.join(',')})`);
    }

    const { data: wordsData, error: wordsError } = await query.limit(50);

    if (wordsError) throw wordsError;

    // 4. 优先返回今天已学习的单词，然后按顺序补充新单词
    const allWords = wordsData || [];
    const todayWords = allWords.filter((w) => todayWordIds.includes(w.id));
    const newWords = allWords.filter((w) => !todayWordIds.includes(w.id));

    // 组合今天的单词和新单词，总共5个
    const selectedWords = [...todayWords, ...newWords].slice(0, 5);

    // 5. 获取这些单词的学习进度
    const { data: progressData, error: progressError } = await supabase
      .from('user_word_progress')
      .select('*')
      .eq('user_id', userId)
      .in('word_id', selectedWords.map((w) => w.id));

    if (progressError) throw progressError;

    // 6. 组合单词和进度数据
    const wordsWithProgress: WordWithProgress[] = selectedWords.map((word) => {
      const progress = progressData?.find((p) => p.word_id === word.id);
      return {
        id: word.id,
        word: word.word,
        phonetic: word.phonetic,
        definition: word.definition,
        example: word.example,
        translation: word.translation,
        level: word.level,
        category: word.category,
        createdAt: new Date(word.created_at),
        progress: progress
          ? {
              id: progress.id,
              userId: progress.user_id,
              wordId: progress.word_id,
              status: progress.status,
              isFavorite: progress.is_favorite,
              learnedDate: new Date(progress.learned_date),
              reviewCount: progress.review_count,
              createdAt: new Date(progress.created_at),
              updatedAt: new Date(progress.updated_at),
            }
          : undefined,
      };
    });

    return wordsWithProgress;
  } catch (error) {
    console.error('Error getting today words:', error);
    throw error;
  }
};

/**
 * 获取今日一句
 * 策略：基于日期选择一句话（确保同一天返回相同的句子）
 */
export const getTodaySentence = async (): Promise<DailySentence | null> => {
  try {
    // 1. 获取所有句子
    const { data, error } = await supabase
      .from('daily_sentences')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return null;
    }

    // 2. 基于今天的日期选择一句话（使用天数取模）
    const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const index = daysSinceEpoch % data.length;
    const sentence = data[index];

    return {
      id: sentence.id,
      sentence: sentence.sentence,
      translation: sentence.translation,
      keywords: sentence.keywords,
      scene: sentence.scene,
      createdAt: new Date(sentence.created_at),
    };
  } catch (error) {
    console.error('Error getting today sentence:', error);
    throw error;
  }
};

/**
 * 标记单词为已掌握
 */
export const markWordAsMastered = async (
  userId: string,
  wordId: string
): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. 检查是否已有进度记录
    const { data: existingData, error: existingError } = await supabase
      .from('user_word_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('word_id', wordId)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      // PGRST116 表示未找到记录
      throw existingError;
    }

    if (existingData) {
      // 更新现有记录
      const { error: updateError } = await supabase
        .from('user_word_progress')
        .update({
          status: 'mastered',
          review_count: existingData.review_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingData.id);

      if (updateError) throw updateError;
    } else {
      // 创建新记录
      const { error: insertError } = await supabase
        .from('user_word_progress')
        .insert([
          {
            user_id: userId,
            word_id: wordId,
            status: 'mastered',
            is_favorite: false,
            learned_date: today,
            review_count: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

      if (insertError) throw insertError;
    }

    // 2. 更新今日学习日志
    await updateStudyLog(userId, 1);
  } catch (error) {
    console.error('Error marking word as mastered:', error);
    throw error;
  }
};

/**
 * 切换单词的收藏状态
 */
export const toggleWordFavorite = async (
  userId: string,
  wordId: string,
  isFavorite: boolean
): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. 检查是否已有进度记录
    const { data: existingData, error: existingError } = await supabase
      .from('user_word_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('word_id', wordId)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    if (existingData) {
      // 更新现有记录
      const { error: updateError } = await supabase
        .from('user_word_progress')
        .update({
          is_favorite: isFavorite,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingData.id);

      if (updateError) throw updateError;
    } else {
      // 创建新记录
      const { error: insertError } = await supabase
        .from('user_word_progress')
        .insert([
          {
            user_id: userId,
            word_id: wordId,
            status: 'learning',
            is_favorite: isFavorite,
            learned_date: today,
            review_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Error toggling word favorite:', error);
    throw error;
  }
};

/**
 * 更新学习日志
 */
const updateStudyLog = async (userId: string, wordsLearned: number): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. 检查今天是否已有日志
    const { data: existingLog, error: existingError } = await supabase
      .from('user_study_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('study_date', today)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    if (existingLog) {
      // 更新现有日志
      const { error: updateError } = await supabase
        .from('user_study_logs')
        .update({
          words_learned: existingLog.words_learned + wordsLearned,
        })
        .eq('id', existingLog.id);

      if (updateError) throw updateError;
    } else {
      // 创建新日志
      const { error: insertError } = await supabase
        .from('user_study_logs')
        .insert([
          {
            user_id: userId,
            study_date: today,
            words_learned: wordsLearned,
            study_duration: 0,
            created_at: new Date().toISOString(),
          },
        ]);

      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Error updating study log:', error);
    throw error;
  }
};

/**
 * 获取学习统计数据
 */
export const getStudyStats = async (userId: string): Promise<StudyStats> => {
  try {
    // 1. 获取所有学习日志
    const { data: logsData, error: logsError } = await supabase
      .from('user_study_logs')
      .select('*')
      .eq('user_id', userId)
      .order('study_date', { ascending: false });

    if (logsError) throw logsError;

    // 2. 获取用户单词进度
    const { data: progressData, error: progressError } = await supabase
      .from('user_word_progress')
      .select('*')
      .eq('user_id', userId);

    if (progressError) throw progressError;

    // 3. 计算连续打卡天数
    let streakDays = 0;
    if (logsData && logsData.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      let currentDate = new Date();

      for (let i = 0; i < logsData.length; i++) {
        const logDate = logsData[i].study_date;
        const expectedDate = currentDate.toISOString().split('T')[0];

        if (logDate === expectedDate) {
          streakDays++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // 4. 统计掌握的单词数
    const masteredWords =
      progressData?.filter((p) => p.status === 'mastered').length || 0;

    // 5. 统计收藏的单词数
    const favoriteWords = progressData?.filter((p) => p.is_favorite).length || 0;

    // 6. 计算总学习时长
    const totalStudyTime =
      logsData?.reduce((sum, log) => sum + (log.study_duration || 0), 0) || 0;

    // 7. 构建学习日历数据
    const studyCalendar: { [date: string]: number } = {};
    logsData?.forEach((log) => {
      studyCalendar[log.study_date] = log.words_learned;
    });

    return {
      streakDays,
      totalWordsLearned: progressData?.length || 0,
      masteredWords,
      favoriteWords,
      totalStudyTime,
      studyCalendar,
    };
  } catch (error) {
    console.error('Error getting study stats:', error);
    throw error;
  }
};

/**
 * 获取收藏的单词列表
 */
export const getFavoriteWords = async (userId: string): Promise<WordWithProgress[]> => {
  try {
    // 1. 获取用户收藏的单词进度
    const { data: progressData, error: progressError } = await supabase
      .from('user_word_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('is_favorite', true)
      .order('updated_at', { ascending: false });

    if (progressError) throw progressError;

    if (!progressData || progressData.length === 0) {
      return [];
    }

    // 2. 获取对应的单词数据
    const wordIds = progressData.map((p) => p.word_id);
    const { data: wordsData, error: wordsError } = await supabase
      .from('english_words')
      .select('*')
      .in('id', wordIds);

    if (wordsError) throw wordsError;

    // 3. 组合单词和进度数据
    const wordsWithProgress: WordWithProgress[] = (wordsData || []).map((word) => {
      const progress = progressData.find((p) => p.word_id === word.id);
      return {
        id: word.id,
        word: word.word,
        phonetic: word.phonetic,
        definition: word.definition,
        example: word.example,
        translation: word.translation,
        level: word.level,
        category: word.category,
        createdAt: new Date(word.created_at),
        progress: progress
          ? {
              id: progress.id,
              userId: progress.user_id,
              wordId: progress.word_id,
              status: progress.status,
              isFavorite: progress.is_favorite,
              learnedDate: new Date(progress.learned_date),
              reviewCount: progress.review_count,
              createdAt: new Date(progress.created_at),
              updatedAt: new Date(progress.updated_at),
            }
          : undefined,
      };
    });

    return wordsWithProgress;
  } catch (error) {
    console.error('Error getting favorite words:', error);
    throw error;
  }
};

/**
 * 使用AI生成指定数量的英语单词
 * @param count 要生成的单词数量
 * @returns 生成的单词列表（不包含progress信息）
 */
export const generateAIWords = async (count: number): Promise<EnglishWord[]> => {
  try {
    // 为了提高成功率，简化prompt并减少单次生成数量
    const batchSize = Math.min(count, 10); // 每次最多生成10个
    const prompt = `Generate ${batchSize} English words for learning. Return ONLY a valid JSON array, no other text.

Format:
[
  {
    "word": "hello",
    "phonetic": "/həˈloʊ/",
    "definition": "a greeting",
    "example": "Hello, nice to meet you!",
    "translation": "你好，很高兴见到你！",
    "level": "A1",
    "category": "日常用语"
  }
]

Requirements:
- Common, practical words
- Mix of levels: A1, A2, B1, B2
- Various categories: 日常用语, 职场, 旅行, 餐饮
- Return ONLY the JSON array, nothing else`;

    console.log(`Requesting AI to generate ${batchSize} words...`);
    const response = await cloudflareAI.sendMessage(prompt);
    console.log('AI response length:', response.length);
    console.log('AI response:', response);

    // 尝试解析AI返回的JSON
    let words: any[];
    try {
      // 先尝试直接解析
      try {
        words = JSON.parse(response.trim());
        console.log('Direct JSON parse succeeded');
      } catch (directError) {
        // 如果直接解析失败，尝试提取JSON数组
        console.log('Direct parse failed, trying to extract JSON array...');

        // 尝试修复不完整的JSON（去掉最后不完整的对象）
        let jsonText = response.trim();

        // 如果JSON不完整，尝试找到最后一个完整的对象
        if (!jsonText.endsWith(']')) {
          console.log('JSON appears incomplete, trying to fix...');
          // 找到最后一个完整的 }
          const lastCompleteObject = jsonText.lastIndexOf('}');
          if (lastCompleteObject !== -1) {
            // 截取到最后一个完整对象，然后加上 ]
            jsonText = jsonText.substring(0, lastCompleteObject + 1) + ']';
            console.log('Fixed JSON by removing incomplete object');
          }
        }

        // 提取JSON数组
        const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          words = JSON.parse(jsonMatch[0]);
          console.log('JSON extraction succeeded');
        } else {
          console.error('No JSON array found in response:', response);
          throw new Error('AI响应中未找到JSON数组');
        }
      }

      // 验证是否是数组
      if (!Array.isArray(words)) {
        throw new Error('AI返回的不是数组格式');
      }

      // 验证数组是否为空
      if (words.length === 0) {
        throw new Error('AI返回的数组为空');
      }

      console.log(`Successfully parsed ${words.length} words from AI response`);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', response);
      throw new Error(`AI返回的数据格式不正确: ${parseError instanceof Error ? parseError.message : '未知错误'}`);
    }

    // 转换为EnglishWord格式，添加容错处理
    const aiWords = words
      .map((word, index) => {
        // 验证必需字段
        if (!word.word || !word.definition) {
          console.warn('Skipping invalid word:', word);
          return null;
        }

        const englishWord: EnglishWord = {
          id: `ai-${Date.now()}-${index}`, // 使用临时ID
          word: word.word,
          phonetic: word.phonetic || '',
          definition: word.definition,
          example: word.example || '',
          translation: word.translation || '',
          level: word.level || 'A1',
          category: word.category || '日常用语',
          createdAt: new Date(),
        };
        return englishWord;
      })
      .filter((word): word is EnglishWord => word !== null); // 过滤掉无效的单词

    if (aiWords.length === 0) {
      throw new Error('没有生成有效的单词');
    }

    console.log(`Successfully generated ${aiWords.length} valid words`);
    return aiWords;
  } catch (error) {
    console.error('Error generating AI words:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};
