export namespace AIChat {
  // 定义函数调用
  export interface FunctionToolCall {
    id: string;
    type: 'function';
    function: {
      arguments: Record<string, any>;
      name: string;
    };
  }

  // 定义消息类型
  export interface DeveloperMessage {
    id: string;
    role: 'developer';
    name?: string;
    content: string;
  }

  export interface SystemMessage {
    id: string;
    role: 'system';
    truncateHistory?: boolean;
    name?: string;
    content: string;
  }

  export interface UserMessage {
    id: string;
    role: 'user';
    name?: string;
    content: string;
  }

  export interface AssistantCallWithResult {
    define: FunctionToolCall;
    isRemote: boolean;
    result?:
      | { type: 'result'; content?: any }
      | { type: 'render'; content?: any };
    running: boolean;
  }

  export interface AssistantMessage {
    id: string;
    role: 'assistant';
    running: boolean;
    content: string;
    name?: string;
    tool_calls?: AssistantCallWithResult[];
  }

  export type ChatMessage =
    | DeveloperMessage
    | SystemMessage
    | UserMessage
    | AssistantMessage;

  export interface HistoryAssistantMessage {
    role: 'assistant';
    content?: string;
    name?: string;
    tool_calls?: (Omit<FunctionToolCall, 'function'> & {
      function: Omit<FunctionToolCall['function'], 'arguments'> & {
        arguments: string;
      };
    })[];
  }

  export interface HistoryToolMessage {
    role: 'tool';
    tool_call_id: string;
    content?: string;
  }

  export type HistoryChatMessage =
    | DeveloperMessage
    | SystemMessage
    | UserMessage
    | HistoryAssistantMessage
    | HistoryToolMessage;

  export namespace FunctionTool {
    export interface PluginMap {}

    export type PluginName = keyof PluginMap;
  }

  // 定义函数工具
  export interface FunctionTool {
    type: 'function';
    function: {
      name: FunctionTool.PluginName;
      description?: string;
      parameters?: Record<string, any>;
      strict?: boolean;
    };
  }

  // 定义函数工具实例
  export interface FunctionToolExecuteInstance {
    type: 'function-execute';
    fn: (params?: Record<string, any>) => any;
  }

  export interface FunctionToolRenderInstance {
    type: 'function-render';
    reportName?: string;
    reportResultName?: string;
  }

  export type FunctionToolInstance =
    | FunctionToolExecuteInstance
    | FunctionToolRenderInstance;

  // 定义任务
  export namespace Task {
    // 定义任务接收的事件
    export interface StartTask {
      type: 'start';
      taskId: string;
    }

    export interface StartRound {
      type: 'start-round';
      chatId: string;
    }

    export interface EndRound {
      type: 'end-round';
      chatId: string;
    }

    export interface AcceptContent {
      type: 'content';
      content: string;
      chatId: string;
    }

    export interface StartCall {
      type: 'start_call';
      chatId: string;
      toolCall: FunctionToolCall;
    }

    export interface EndCall {
      type: 'end_call';
      chatId: string;
      toolCallId: string;
      result: any;
    }

    export interface FinishTask {
      type: 'finish';
    }

    export interface Error {
      type: 'error';
    }

    export type TaskAcceptEvent =
      | StartTask
      | StartRound
      | EndRound
      | AcceptContent
      | StartCall
      | EndCall
      | FinishTask
      | Error;

    // 定义任务的状态
    export type Status = 'pending' | 'running' | 'finished' | 'stopped';

    // 定义任务发出的事件
    export interface ChangeStatus {
      type: 'change-status';
      status: Status;
    }

    export interface ChangeMessageList {
      type: 'change-message-list';
      messages: ChatMessage[];
    }

    export interface ChangeMessageContent {
      type: 'change-message-content';
      messageId: string;
      content: string;
    }

    export interface ChangeMessageRunning {
      type: 'change-message-running';
      messageId: string;
      running: boolean;
    }

    export interface ChangeFunctionCallList {
      type: 'change-function-call-list';
      messageId: string;
      functionCalls: AssistantCallWithResult[];
    }

    export interface ChangeFunctionCall {
      type: 'change-function-call';
      messageId: string;
      functionCall: AssistantCallWithResult;
    }

    export type TaskEmitEvent =
      | ChangeStatus
      | ChangeMessageList
      | ChangeMessageContent
      | ChangeMessageRunning
      | ChangeFunctionCallList
      | ChangeFunctionCall;

    // 定义transpoter
    export interface Transporter {
      simpleChart: (options: {
        prompt: string;
        historyMessages?: HistoryChatMessage[];
      }) => Promise<string>;
      startTask: (
        options: {
          id?: string;
          prompt: string;
          historyMessages?: HistoryChatMessage[];
          functionTools?: FunctionTool[];
          signal?: AbortSignal | null;
        },
        callback: (event: TaskAcceptEvent) => void
      ) => void;
      reportFunctionCallResult: (options: {
        taskId: string;
        callId: string;
        result: any;
      }) => void;
    }
  }
}
