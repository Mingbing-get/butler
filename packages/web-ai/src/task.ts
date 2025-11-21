import toolManager from './toolManager';
import type { AIChat } from './type';

export default class Task {
  taskId: string = '';
  title: string = '';

  private status: AIChat.Task.Status = 'pending';
  private messages: AIChat.ChatMessage[] = [];
  private pickToolNames?: AIChat.FunctionTool.PluginName[];
  private listeners: {
    [K in AIChat.Task.TaskEmitEvent['type']]?: Array<
      (event: Extract<AIChat.Task.TaskEmitEvent, { type: K }>) => void
    >;
  } = {};
  private transporter?: AIChat.Task.Transporter;
  private controller?: AbortController;

  constructor(
    pickToolNames?: AIChat.FunctionTool.PluginName[],
    transporter?: AIChat.Task.Transporter
  ) {
    this.pickToolNames = pickToolNames;
    this.transporter = transporter;
  }

  setPickToolNames(pickToolNames?: AIChat.FunctionTool.PluginName[]) {
    this.pickToolNames = pickToolNames;
  }

  setTransporter(transporter?: AIChat.Task.Transporter) {
    this.transporter = transporter;
  }

  addSystemMessage(content: string, truncateHistory?: boolean) {
    this.messages.push({
      id: `system-${Date.now()}`,
      role: 'system',
      truncateHistory,
      content,
    });

    this.emit({
      type: 'change-message-list',
      messages: this.messages,
    });
  }

  getTransporter() {
    return this.transporter;
  }

  getStatus() {
    return this.status;
  }

  getMessages() {
    return this.messages;
  }

  getMessageById(messageId: string) {
    return this.messages.find((message) => message.id === messageId);
  }

  getFunctionCallList(messageId: string) {
    const message = this.messages.find((message) => message.id === messageId);
    if (message?.role !== 'assistant') return [];

    return message.tool_calls || [];
  }

  getFunctionCallById(messageId: string, functionCallId: string) {
    const functionCallList = this.getFunctionCallList(messageId);
    return functionCallList.find(
      (functionCall) => functionCall.define.id === functionCallId
    );
  }

  async send(prompt: string) {
    if (!this.transporter) {
      throw new Error('Transporter is not set');
    }
    if (this.status === 'running') {
      throw new Error('Task is already running');
    }
    this.changeStatus('running');

    let resolve: (taskId: string) => void = () => {};
    const promise = new Promise<string>((fn) => {
      resolve = fn;
    });

    this.controller = new AbortController();

    this.transporter.startTask(
      {
        id: this.taskId || undefined,
        prompt,
        historyMessages: this.toHistoryMessage(),
        functionTools: toolManager.getTools(this.pickToolNames),
        signal: this.controller.signal,
      },
      (data) => {
        if (data.type === 'start') {
          this.addUserMessage(prompt);
          this.taskId = data.taskId;
          resolve(this.taskId);
        } else if (data.type === 'finish') {
          this.changeStatus('finished');
        } else if (data.type === 'start-round') {
          this.startAssistantMessage(data.chatId);
        } else if (data.type === 'end-round') {
          this.endAssistantMessage(data.chatId);
        } else if (data.type === 'content') {
          this.updateAssistantMessage(data.chatId, data.content);
        } else if (data.type === 'start_call') {
          this.startFunctionCall(data.chatId, data.toolCall);
        } else if (data.type === 'end_call') {
          this.endFunctionCall(data.chatId, data.toolCallId, data.result);
        } else if (data.type === 'error') {
          this.endAllStatus();
        }
      }
    );

    return promise;
  }

  stop() {
    if (this.status !== 'running') return;

    this.controller?.abort();
  }

  on<T extends AIChat.Task.TaskEmitEvent['type']>(
    type: T,
    listener: (event: Extract<AIChat.Task.TaskEmitEvent, { type: T }>) => void
  ) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);

    return () => {
      if (this.listeners[type]) {
        this.listeners[type] = this.listeners[type].filter(
          (item) => item !== listener
        ) as any;
      }
    };
  }

  private emit(event: AIChat.Task.TaskEmitEvent) {
    this.listeners[event.type]?.forEach((item) => item(event as any));
  }

  toHistoryMessage(enabledTruncate: boolean = true) {
    const messages: AIChat.ChatMessage[] = [];
    if (enabledTruncate) {
      for (let i = this.messages.length - 1; i >= 0; i--) {
        const item = this.messages[i];
        messages.unshift(item);

        if (item.role === 'system' && item.truncateHistory) {
          break;
        }
      }
    } else {
      messages.push(...this.messages);
    }

    return messages.reduce((acc: AIChat.HistoryChatMessage[], message) => {
      if (message.role === 'assistant') {
        acc.push({
          role: 'assistant',
          content: message.content,
          name: message.name,
          tool_calls: message.tool_calls?.map((item) => {
            return {
              ...item.define,
              function: {
                ...item.define.function,
                arguments: JSON.stringify(item.define.function.arguments),
              },
            };
          }),
        });

        message.tool_calls?.forEach((item) => {
          acc.push({
            role: 'tool',
            tool_call_id: item.define.id,
            content:
              item.result !== undefined
                ? typeof item.result.content === 'string'
                  ? item.result.content
                  : JSON.stringify(item.result.content)
                : 'success',
          });
        });
      } else {
        acc.push(message);
      }

      return acc;
    }, []);
  }

  private endAllStatus() {
    const lastMessage = this.messages[this.messages.length - 1];
    if (lastMessage?.role === 'assistant') {
      if (lastMessage.running) {
        this.endAssistantMessage(lastMessage.id);
      }
      lastMessage.tool_calls?.forEach((item) => {
        if (item.running) {
          this.endFunctionCall(lastMessage.id, item.define.id, undefined);
        }
      });
    }
    this.changeStatus('stopped');
  }

  private changeStatus(status: AIChat.Task.Status) {
    this.status = status;

    this.emit({
      type: 'change-status',
      status,
    });
  }

  private addUserMessage(prompt: string) {
    this.messages.push({
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
    });

    this.emit({
      type: 'change-message-list',
      messages: this.messages,
    });
  }

  private startAssistantMessage(id: string) {
    this.messages.push({
      id,
      role: 'assistant',
      running: true,
      content: '',
    });

    this.emit({
      type: 'change-message-list',
      messages: this.messages,
    });
  }

  private endAssistantMessage(id: string) {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const item = this.messages[i];
      if (item.role === 'assistant' && item.id === id) {
        item.running = false;

        this.emit({
          type: 'change-message-running',
          messageId: id,
          running: false,
        });
        break;
      }
    }
  }

  private updateAssistantMessage(id: string, chunk: string) {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const item = this.messages[i];
      if (item.role === 'assistant' && item.id === id) {
        item.content += chunk;

        this.emit({
          type: 'change-message-content',
          messageId: id,
          content: item.content || '',
        });
        break;
      }
    }
  }

  private async startFunctionCall(
    id: string,
    toolCall: AIChat.FunctionToolCall
  ) {
    const toolInstance = toolManager.getToolInstance(toolCall.function.name);
    const toolCallInstance: AIChat.AssistantCallWithResult = {
      define: toolCall,
      isRemote: !toolInstance,
      running: true,
      result: {
        type: toolInstance?.type === 'function-render' ? 'render' : 'result',
      },
    };

    for (let i = this.messages.length - 1; i >= 0; i--) {
      const item = this.messages[i];
      if (item.role === 'assistant' && item.id === id) {
        item.tool_calls = item.tool_calls || [];
        item.tool_calls.push(toolCallInstance);

        this.emit({
          type: 'change-function-call-list',
          messageId: id,
          functionCalls: item.tool_calls,
        });
        break;
      }
    }

    if (toolCallInstance.isRemote) {
      return;
    }

    const res = await toolManager.executeToolCall(toolCall);
    toolCallInstance.running = false;
    toolCallInstance.result = res;

    this.emit({
      type: 'change-function-call',
      messageId: id,
      functionCall: toolCallInstance,
    });
    await this.reportFunctionCallResult(
      toolCall.id,
      res.content === undefined ? 'success' : res.content
    );
  }

  private endFunctionCall(id: string, toolCallId: string, result: any) {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const item = this.messages[i];
      if (item.role === 'assistant' && item.id === id) {
        const toolCall = item.tool_calls?.find(
          (call) => call.define.id === toolCallId
        );
        if (toolCall && toolCall.running) {
          toolCall.running = false;
          toolCall.result = {
            type: 'result',
            content: result,
          };

          this.emit({
            type: 'change-function-call',
            messageId: id,
            functionCall: toolCall,
          });
        }
        break;
      }
    }
  }

  private async reportFunctionCallResult(callId: string, result: any) {
    if (!this.transporter) {
      throw new Error('Transporter is not set');
    }

    this.transporter.reportFunctionCallResult({
      taskId: this.taskId,
      callId,
      result,
    });
  }
}
