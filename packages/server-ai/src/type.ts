import OpenAI from 'openai';
import AIService from './aiService';

export namespace ButlerAi {
  export namespace AiService {
    export interface Context {}

    export interface Options {
      apiKey: string;
      apiUrl: string;
      defaultModel: string;
      supportFunctionCall?: boolean;
    }

    export interface FunctionToolInstance {
      (args: any, context: Context): Promise<any>;
    }
  }

  export namespace ParseStream {
    export interface ContentListener {
      (detail: string): void;
    }

    export interface FunctionCallListener {
      (
        call: OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall.Function
      ): void;
    }

    export interface ErrorToolCall {
      (input: string): void;
    }

    export interface EndListener {
      (): void;
    }
  }

  export namespace Task {
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
      toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall;
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

    export type TaskEvent =
      | StartRound
      | EndRound
      | AcceptContent
      | StartCall
      | EndCall
      | FinishTask
      | Error;

    export interface Options {
      aiService: AIService;
      prompt: string;
      context: AiService.Context;
      extraTools?: Array<OpenAI.Chat.Completions.ChatCompletionFunctionTool>;
      id?: string;
    }
  }
}
