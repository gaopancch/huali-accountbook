/**
 * Cloudflare Worker - AI Chat API
 *
 * 这个 Worker 作为中转服务，调用 Cloudflare Workers AI
 * 用户的前端应用调用这个 Worker，Worker 再调用 AI 模型
 */

export default {
  async fetch(request, env) {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // 只允许 POST 请求
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { messages } = await request.json();

      if (!messages || !Array.isArray(messages)) {
        return new Response(
          JSON.stringify({ error: '无效的请求格式' }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        );
      }

      // 限制对话历史长度（只保留最近10条消息，包含system message）
      // 这样可以加快处理速度，特别对移动端有帮助
      const limitedMessages = messages.slice(-10);

      // 调用 Cloudflare Workers AI
      // 使用 @cf/meta/llama-3.1-8b-instruct 模型（免费，支持中文）
      const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: limitedMessages,
        stream: false,
        max_tokens: 512,  // 减少 token 数量加快响应
        temperature: 0.7,
      });

      return new Response(
        JSON.stringify({
          response: response.response || response.result?.response || '抱歉，我现在无法回答。',
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
          },
        }
      );
    } catch (error) {
      console.error('AI API Error:', error);

      return new Response(
        JSON.stringify({
          error: '处理请求时出错，请稍后再试',
          details: error.message
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  },
};
