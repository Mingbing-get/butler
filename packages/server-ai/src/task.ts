import OpenAI from 'openai';
import { randomUUID } from 'node:crypto';

import AIService from './aiService';
import type { ButlerAi } from './type';

export default class Task {
  private aiService: AIService;
  private extraTools?: Array<OpenAI.Chat.Completions.ChatCompletionFunctionTool>;

  private status: 'pending' | 'running' | 'stopped' | 'finish' = 'pending';
  private messages: Array<OpenAI.Chat.Completions.ChatCompletionMessageParam> =
    [];
  private listeners: Array<(event: ButlerAi.Task.TaskEvent) => void> = [];
  private extraToolWaiting: Record<string, (result: any) => void> = {};

  private context: ButlerAi.AiService.Context;
  readonly id: string;

  constructor({
    aiService,
    prompt,
    extraTools,
    id,
    context,
  }: ButlerAi.Task.Options) {
    this.aiService = aiService;
    this.extraTools = extraTools;
    this.messages.push({
      role: 'user',
      content: prompt,
    });
    this.id = id || randomUUID();
    this.context = context;
  }

  addHistoryMessage(
    messages: Array<OpenAI.Chat.Completions.ChatCompletionMessageParam>
  ) {
    this.messages.unshift(...messages);
  }

  start() {
    if (this.status !== 'pending') {
      throw new Error('Task status is not pendding');
    }
    this.status = 'running';

    this.sendRequest();
  }

  stop() {
    this.status = 'stopped';
  }

  on(listener: (event: ButlerAi.Task.TaskEvent) => void) {
    this.listeners.push(listener);
  }

  resolveToolCall(callId: string, result: any) {
    if (this.extraToolWaiting[callId]) {
      this.extraToolWaiting[callId](result);
      delete this.extraToolWaiting[callId];
    }
  }

  private async sendRequest() {
    if (this.status !== 'running') return;

    let content = '';
    const errorToolCalls: Array<OpenAI.Chat.Completions.ChatCompletionMessageCustomToolCall> =
      [];
    const toolCalls: Array<OpenAI.Chat.Completions.ChatCompletionMessageToolCall> =
      [];
    const chatId = randomUUID();

    try {
      const stream = this.aiService.createChatCompletionStream(
        this.messages,
        this.extraTools
      );
      this.triggerListeners({ type: 'start-round', chatId });

      stream.onContent((delta) => {
        if (delta) {
          this.triggerListeners({ type: 'content', content: delta, chatId });
        }
      });

      stream.onFunctionCall((data) => {
        toolCalls.push({
          id: randomUUID(),
          type: 'function',
          function: data,
        });
      });

      stream.onErrorToolCall((input) => {
        errorToolCalls.push({
          id: randomUUID(),
          type: 'custom',
          custom: {
            name: 'error_tool',
            input,
          },
        });
      });

      await new Promise<void>((resolve) => {
        stream.onEnd(() => {
          content = stream.getContent();
          resolve();
        });
      });
    } catch (error) {
      this.triggerListeners({ type: 'error' });
      return;
    }

    this.messages.push({
      role: 'assistant',
      content,
      tool_calls: [...toolCalls, ...errorToolCalls],
    });

    await this.runToolCalls(chatId, toolCalls);
    errorToolCalls.forEach((item) => {
      this.messages.push({
        role: 'tool',
        content:
          'Invalid tool call format, please strictly follow the function definition',
        tool_call_id: item.id,
      });
    });

    this.triggerListeners({ type: 'end-round', chatId });

    if (toolCalls.length > 0) {
      this.sendRequest();
    } else {
      this.triggerListeners({ type: 'finish' });
      this.status = 'finish';
    }
  }

  private triggerListeners(event: ButlerAi.Task.TaskEvent) {
    if (this.status !== 'running') return;

    this.listeners.forEach((listener) => listener(event));
  }

  private async runToolCalls(
    chatId: string,
    toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[]
  ) {
    for await (const toolCall of toolCalls) {
      if (!toolCall.id) {
        toolCall.id = randomUUID();
      }

      // 检查工具函数参数是否为json，若不是则返回错误消息，并且不触发监听器
      try {
        if (toolCall.type === 'function') {
          JSON.parse(toolCall.function.arguments || '{}');
        }
      } catch (error) {
        this.messages.push({
          role: 'tool',
          content: 'Tool call arguments is not valid json',
          tool_call_id: toolCall.id,
        });

        return;
      }

      // 开始执行工具函数
      this.triggerListeners({ type: 'start_call', chatId, toolCall });

      const result = await this.runFunctionTool(toolCall);

      this.messages.push({
        role: 'tool',
        content: typeof result === 'string' ? result : JSON.stringify(result),
        tool_call_id: toolCall.id,
      });

      this.triggerListeners({
        type: 'end_call',
        chatId,
        toolCallId: toolCall.id,
        result,
      });
    }
  }

  private async runFunctionTool(
    toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall
  ) {
    if (toolCall.type !== 'function') {
      return 'Tool call type is not function';
    }

    const extraTool = this.extraTools?.find(
      (t) => t.function.name === toolCall.function.name
    );
    if (!extraTool) {
      return await this.aiService.executeFunctionTool(toolCall, this.context);
    }

    return new Promise<any>((resolve) => {
      this.extraToolWaiting[toolCall.id] = resolve;
    });
  }
}
