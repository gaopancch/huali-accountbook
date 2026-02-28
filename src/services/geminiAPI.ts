/**
 * Google Gemini API 服务
 *
 * 如何获取免费 API Key：
 * 1. 访问 https://makersuite.google.com/app/apikey （需要科学上网）
 * 2. 点击 "Get API Key"
 * 3. 创建新的 API Key
 * 4. 复制 API Key 并保存到浏览器 localStorage
 *
 * 免费额度：
 * - 每分钟 15 次请求
 * - 每天 1500 次请求
 * - 完全免费，无需绑卡
 */

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
    };
  }[];
}

/**
 * 从 localStorage 获取 API Key
 */
export const getApiKey = (): string | null => {
  return localStorage.getItem('gemini_api_key');
};

/**
 * 保存 API Key 到 localStorage
 */
export const saveApiKey = (apiKey: string): void => {
  localStorage.setItem('gemini_api_key', apiKey);
};

/**
 * 删除保存的 API Key
 */
export const removeApiKey = (): void => {
  localStorage.removeItem('gemini_api_key');
};

/**
 * 调用 Gemini API 发送消息
 */
export const sendMessage = async (
  message: string,
  conversationHistory: GeminiMessage[] = []
): Promise<string> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error('请先设置 Gemini API Key');
  }

  try {
    // 构建完整的对话历史
    const messages: GeminiMessage[] = [
      ...conversationHistory,
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 400) {
        throw new Error('API Key 无效或请求格式错误');
      } else if (response.status === 429) {
        throw new Error('请求过于频繁，请稍后再试');
      } else if (response.status === 403) {
        throw new Error('API Key 权限不足或已过期');
      } else {
        throw new Error(`API 请求失败: ${response.status}`);
      }
    }

    const data: GeminiResponse = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('AI 未返回有效响应');
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    return aiResponse;
  } catch (error) {
    console.error('Gemini API Error:', error);

    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('发送消息失败，请检查网络连接');
    }
  }
};

/**
 * 测试 API Key 是否有效
 */
export const testApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Hello' }],
          },
        ],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('API Key test failed:', error);
    return false;
  }
};
