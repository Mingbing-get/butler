import { Middleware } from '@koa/router';
import { OpenAI } from '@ai-nucl/server-ai';

import aiService from '../../aiService';

const generateText: Middleware = async (ctx) => {
  const { prompt, historyMessages } = ctx.request.body as {
    prompt: string;
    historyMessages?: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  };

  const res = await aiService.createChatCompletion({
    messages: [...(historyMessages || []), { role: 'user', content: prompt }],
    context: {
      user: ctx.state.user,
    },
    pickToolNames: [],
  });

  const text = res.choices[0]?.message?.content || '';
  ctx.body = text;
};

export default generateText;
