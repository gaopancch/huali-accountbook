/**
 * Cloudflare Workers AI 服务
 *
 * 调用部署在 Cloudflare 的 AI Worker
 * 完全免费，无需 API Key
 */

// Cloudflare Worker 的 URL
// 使用相对路径调用 Pages Function（避免 workers.dev 访问问题）
const WORKER_URL = process.env.REACT_APP_AI_WORKER_URL || '/api/ai-chat';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  response: string;
  error?: string;
}

/**
 * 调用 AI Worker 发送消息
 */
export const sendMessage = async (
  message: string,
  conversationHistory: AIMessage[] = []
): Promise<string> => {
  try {
    // 构建完整的对话历史
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: '你是一个友好的AI助手，可以帮助用户解答各种问题。请用中文回答，尽量简洁。',
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message,
      },
    ];

    // 创建超时控制器（30秒超时）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(WORKER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 429) {
          throw new Error('请求过于频繁，请稍后再试');
        } else if (response.status === 500) {
          throw new Error(errorData.error || 'AI 服务暂时不可用');
        } else {
          throw new Error(`请求失败: ${response.status}`);
        }
      }

      const data: AIResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.response) {
        throw new Error('AI 未返回有效响应');
      }

      return data.response;
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('请求超时，请检查网络连接或稍后再试');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('AI API Error:', error);

    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('发送消息失败，请检查网络连接');
    }
  }
};

/**
 * 测试 AI 服务是否可用
 */
export const testAIService = async (): Promise<boolean> => {
  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('AI service test failed:', error);
    return false;
  }
};
