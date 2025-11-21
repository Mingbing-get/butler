import { ChatCompletionStream } from 'openai/lib/ChatCompletionStream';
import OpenAI from 'openai';

import type { ButlerAi } from './type';

export default class ParseStream {
  static readonly START_TOOL_CALL = '===tool_call===';
  static readonly END_TOOL_CALL = '===end_tool_call===';
  static readonly TOOL_CALL_REGEX =
    /===tool_call===([\s\S]*?)===end_tool_call===/;

  private content = '';
  private toolCalls: Array<OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall.Function> =
    [];

  private contentListener?: ButlerAi.ParseStream.ContentListener;
  private functionCallListener?: ButlerAi.ParseStream.FunctionCallListener;
  private errorToolCallListener?: ButlerAi.ParseStream.ErrorToolCall;
  private endListener?: ButlerAi.ParseStream.EndListener;

  constructor(private stream: ChatCompletionStream<null>) {
    stream.on('content', (delta) => {
      if (delta) {
        this.content += delta;
        const parsed = this.parseTool();
        if (parsed === true) {
          return;
        } else if (parsed) {
          this.contentListener?.(parsed);
          return;
        }

        this.contentListener?.(delta);
      }
    });

    stream.on('tool_calls.function.arguments.done', (data) => {
      this.toolCalls.push(data);
      this.functionCallListener?.(data);
    });

    stream.on('end', () => {
      this.endListener?.();
    });
  }

  onContent(listener: ButlerAi.ParseStream.ContentListener) {
    this.contentListener = listener;
  }

  onFunctionCall(listener: ButlerAi.ParseStream.FunctionCallListener) {
    this.functionCallListener = listener;
  }

  onErrorToolCall(listener: ButlerAi.ParseStream.ErrorToolCall) {
    this.errorToolCallListener = listener;
  }

  onEnd(listener: ButlerAi.ParseStream.EndListener) {
    this.endListener = listener;
  }

  stop() {
    this.stream.abort();
  }

  getContent() {
    return this.content;
  }

  private parseTool(): boolean | string {
    if (
      this.content.includes(ParseStream.START_TOOL_CALL) ||
      this.endsWithPart(this.content, ParseStream.START_TOOL_CALL)
    ) {
      const match = this.content.match(ParseStream.TOOL_CALL_REGEX);
      if (match) {
        const afterContent = this.content.substring(
          (match.index || 0) + match[0].length
        );
        this.content = this.content.replace(match[0], '');

        try {
          const toolCall = JSON.parse(match[1]);
          if (
            toolCall.arguments !== undefined &&
            typeof toolCall.arguments !== 'string'
          ) {
            toolCall.arguments = JSON.stringify(toolCall.arguments);
          }
          this.toolCalls.push(toolCall);
          this.functionCallListener?.(toolCall);
        } catch (error) {
          this.errorToolCallListener?.(match[1]);
        }

        if (afterContent) {
          return afterContent;
        }
      }

      return true;
    }

    return false;
  }

  private endsWithPart(orgStr: string, matchStr: string) {
    for (let i = matchStr.length; i > 0; i--) {
      const part = matchStr.substring(0, i);
      if (orgStr.endsWith(part)) {
        return true;
      }
    }

    return false;
  }
}
