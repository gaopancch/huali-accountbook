/**
 * Cloudflare Worker - AI Chat API (稳定版本)
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

      // 限制对话历史长度（只保留最近8条消息）
      const limitedMessages = messages.slice(-8);

      // 调用 Cloudflare Workers AI
      const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: limitedMessages,
        stream: false,
        max_tokens: 512,
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
