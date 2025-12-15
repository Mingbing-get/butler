import type { AIChat } from '../type';

interface HttpRequestOptions {
  url: string;
  method?: string;
  headers?: Record<string, string>;
}

type Functionable<T> = T | (() => T);

interface Options {
  simpleChatRequestOptions: Functionable<HttpRequestOptions>;
  startTaskRequestOptions: Functionable<HttpRequestOptions>;
  reportFunctionCallResultRequestOptions: Functionable<HttpRequestOptions>;
}

export class HttpTransporter implements AIChat.Task.Transporter {
  private options: Options;

  constructor(options: Options) {
    this.options = options;
  }

  async simpleChat(options: {
    prompt: string;
    historyMessages?: AIChat.HistoryChatMessage[];
  }) {
    let requestOptions = this.options.simpleChatRequestOptions;
    if (typeof requestOptions === 'function') {
      requestOptions = requestOptions();
    }

    const response = await fetch(requestOptions.url, {
      method: requestOptions.method || 'POST',
      headers: requestOptions.headers,
      body: JSON.stringify({
        prompt: options.prompt,
        historyMessages: options.historyMessages,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to simple chat');
    }

    return response.text();
  }

  async startTask(
    options: {
      id?: string;
      prompt: string;
      historyMessages?: AIChat.HistoryChatMessage[];
      functionTools?: AIChat.FunctionTool[];
      signal?: AbortSignal | null;
    },
    callback: (event: AIChat.Task.TaskAcceptEvent) => void
  ) {
    let requestOptions = this.options.startTaskRequestOptions;
    if (typeof requestOptions === 'function') {
      requestOptions = requestOptions();
    }
    const response = await fetch(requestOptions.url, {
      method: requestOptions.method || 'POST',
      headers: requestOptions.headers,
      body: JSON.stringify({
        id: options.id,
        prompt: options.prompt,
        historyMessages: options.historyMessages,
        functionTools: options.functionTools,
      }),
      signal: options.signal,
    });

    if (!response.ok) {
      throw new Error('Failed to start task');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get reader');
    }

    const decoder = new TextDecoder();
    while (true) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        const chunk = decoder.decode(value);

        const data = this.mergeMessageContent(this.parseJsonStream(chunk));
        data.forEach(callback);
      } catch (error) {
        callback({ type: 'error' });
        break;
      }
    }
  }

  async reportFunctionCallResult(options: {
    taskId: string;
    callId: string;
    result: any;
  }) {
    let requestOptions = this.options.reportFunctionCallResultRequestOptions;
    if (typeof requestOptions === 'function') {
      requestOptions = requestOptions();
    }

    await fetch(requestOptions.url, {
      method: requestOptions.method || 'POST',
      headers: requestOptions.headers,
      body: JSON.stringify({
        taskId: options.taskId,
        callId: options.callId,
        result: options.result,
      }),
    });
  }

  private parseJsonStream(jsonStr: string) {
    const result: any[] = [];

    const list = jsonStr.split('\n\n').filter(Boolean);
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      try {
        result.push(JSON.parse(item));
      } catch (error) {
        if (i + 1 < list.length) {
          list[i + 1] = item + list[i + 1];
        }
      }
    }

    return result;
  }

  private mergeMessageContent(messages: AIChat.Task.TaskAcceptEvent[]) {
    let lastContent: AIChat.Task.AcceptContent | undefined = undefined;

    return messages.reduce((total: AIChat.Task.TaskAcceptEvent[], item) => {
      if (item.type === 'content') {
        if (!lastContent || lastContent.chatId !== item.chatId) {
          lastContent = item;
          total.push(item);
        } else {
          lastContent.content += item.content;
        }
      } else {
        total.push(item);
      }

      return total;
    }, []);
  }
}
