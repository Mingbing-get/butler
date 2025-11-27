import { Middleware } from '@koa/router';
import { Readable } from 'stream';
import { Task, OpenAI } from '@ai-nucl/server-ai';

import aiService from '../../aiService';

export const taskMap = new Map<string, Task>();

const task: Middleware = async (ctx) => {
  const { prompt, historyMessages, functionTools, id } = ctx.request.body as {
    prompt: string;
    historyMessages?: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
    functionTools?: OpenAI.Chat.Completions.ChatCompletionFunctionTool[];
    id?: string;
  };

  // 设置响应头为Server-Sent Events格式
  ctx.type = 'application/octet-stream';
  ctx.set('Cache-Control', 'no-cache');
  ctx.set('Connection', 'keep-alive');
  ctx.status = 200;

  const stream = new Readable({
    read() {},
  });

  // 创建Task实例
  const task = aiService.createTask({
    context: {
      user: ctx.state.user,
    },
    prompt,
    extraTools: functionTools,
    id,
  });
  if (historyMessages) {
    task.addHistoryMessage(historyMessages);
  }

  taskMap.set(task.id, task);
  const event = { type: 'start', taskId: task.id };
  stream.push(`${JSON.stringify(event)}\n\n`);

  task.on((event) => {
    let send = event;
    if (send.type === 'start_call' && send.toolCall.type === 'function') {
      send = {
        ...send,
        toolCall: {
          ...send.toolCall,
          function: {
            ...send.toolCall.function,
            arguments: JSON.parse(send.toolCall.function.arguments || '{}'),
          },
        },
      };
    }
    stream.push(`${JSON.stringify(send)}\n\n`);

    if (event.type === 'finish' || event.type === 'error') {
      stream.push(null);
      taskMap.delete(task.id);
    }
  });

  // 处理连接关闭
  ctx.req.on('close', () => {
    stream.push(null);
    task.stop();
    taskMap.delete(task.id);
  });

  stream.on('close', () => {
    task.stop();
    taskMap.delete(task.id);
  });

  // 启动任务
  task.start();

  // 由于是流式响应，不返回常规的响应体
  ctx.body = stream;
};

export default task;
