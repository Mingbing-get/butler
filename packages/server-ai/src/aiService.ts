import { OpenAI } from 'openai';
import { randomUUID } from 'node:crypto';

import Task from './task';
import ParseStream from './parseStream';
import { ButlerAi } from './type';

/**
 * OpenAI服务类，封装了与OpenAI API交互的方法
 */
export default class AIService {
  private client: OpenAI;
  private defaultModel: string;
  private supportFunctionCall: boolean;
  private tools: Array<OpenAI.Chat.Completions.ChatCompletionFunctionTool> = [];
  private toolFunctions: Record<
    string,
    ButlerAi.AiService.FunctionToolInstance
  > = {};

  constructor(options: ButlerAi.AiService.Options) {
    this.client = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.apiUrl,
    });
    this.defaultModel = options.defaultModel;
    this.supportFunctionCall = options.supportFunctionCall || false;
  }

  /**
   * 添加工具
   * @param tool 工具配置
   */
  addFunctionTool(
    func: OpenAI.Chat.Completions.ChatCompletionFunctionTool['function'],
    functionImpl: ButlerAi.AiService.FunctionToolInstance
  ) {
    this.tools.push({
      type: 'function',
      function: func,
    });
    this.toolFunctions[func.name] = functionImpl;

    return this;
  }

  async executeFunctionTool(
    toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall,
    context: ButlerAi.AiService.Context
  ) {
    if (toolCall.type !== 'function') {
      return `Tool is not a function tool`;
    }

    const tool = this.tools.find(
      (t) => t.function.name === toolCall.function.name
    );
    if (!tool) {
      return `Tool ${toolCall.function.name} not found`;
    }
    // 执行工具函数
    const functionArgs = JSON.parse(toolCall.function.arguments || '{}');
    try {
      const result = await this.toolFunctions[tool.function.name](
        functionArgs,
        context
      );
      return result;
    } catch (error) {
      console.log((error as Error).message);
      return `Error executing tool ${tool.function.name}: ${(error as Error).message}`;
    }
  }

  /**
   * 发送聊天完成请求
   * @param messages 消息数组
   * @returns 聊天完成响应
   */
  async createChatCompletion(
    messages: Array<OpenAI.Chat.Completions.ChatCompletionMessageParam>,
    extraTools?: Array<OpenAI.Chat.Completions.ChatCompletionFunctionTool>,
    useTool: boolean = true
  ) {
    try {
      if (this.supportFunctionCall) {
        return await this.client.chat.completions.create({
          model: this.defaultModel,
          messages: messages,
          tools: useTool ? [...this.tools, ...(extraTools || [])] : undefined,
        });
      }

      const withToolMessages = [...this.messageToNotSuportMessage(messages)];
      if (useTool) {
        const allTools = [...this.tools, ...(extraTools || [])];
        if (allTools.length > 0) {
          withToolMessages.unshift(this.toolToSystemMessage(allTools));
        }
      }
      const response = await this.client.chat.completions.create({
        model: this.defaultModel,
        messages: withToolMessages,
      });
      this.normalChoiceToHasTool(response);
      return response;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }

  /**
   * 发送流式聊天完成请求
   * @param messages 消息数组
   * @returns 聊天完成响应
   */
  createChatCompletionStream(
    messages: Array<OpenAI.Chat.Completions.ChatCompletionMessageParam>,
    extraTools?: Array<OpenAI.Chat.Completions.ChatCompletionFunctionTool>
  ) {
    if (this.supportFunctionCall) {
      const stream = this.client.chat.completions.stream({
        model: this.defaultModel,
        messages: messages,
        tools: [...this.tools, ...(extraTools || [])],
        stream: true,
      });

      return new ParseStream(stream);
    }

    const stream = this.client.chat.completions.stream({
      model: this.defaultModel,
      messages: [
        this.toolToSystemMessage([...this.tools, ...(extraTools || [])]),
        ...this.messageToNotSuportMessage(messages),
      ],
      stream: true,
    });

    return new ParseStream(stream);
  }

  createTask(options: Omit<ButlerAi.Task.Options, 'aiService'>) {
    return new Task({
      ...options,
      aiService: this,
    });
  }

  private toolToSystemMessage(
    tools: Array<OpenAI.Chat.Completions.ChatCompletionFunctionTool>
  ): OpenAI.Chat.Completions.ChatCompletionSystemMessageParam {
    const toolStrMap = tools.map((tool) => {
      return `- 工具名称：${tool.function.name}
      - 工具描述：${tool.function.description}
      - 工具参数：${JSON.stringify(tool.function.parameters || {}, null, 2)}`;
    });

    const tip = `你是一个智能助手，可以通过调用工具来回答问题。请遵循以下步骤：
1. 分析用户的问题，确定其意图。
2. 若有需要可从下面的工具列表中选择最合适的工具。
3. 严格按照以下格式输出，不要有任何其他额外说明(注意：仅可选择已提供的工具，arguments必须为一个object，且严格遵循tool的参数定义，若不需要参数也必须返回一个空的object)：

其他非工具的回答
${ParseStream.START_TOOL_CALL}
{
  "name": "get_weather",
  "arguments": "{\"location\": \"北京\"}"
}
${ParseStream.END_TOOL_CALL}

可用工具：
${toolStrMap.join('\n')}
`;

    return {
      role: 'system',
      content: tip,
    };
  }

  private messageToNotSuportMessage(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
  ) {
    return messages.map((message) => {
      if (message.role === 'tool' && !message.content) {
        return {
          ...message,
          content: 'success',
        };
      }

      if (message.role !== 'assistant') {
        return message;
      }

      const { tool_calls, content, ...other } = message;
      const toolCallstr =
        tool_calls?.map((toolCall) => {
          if (toolCall.type !== 'function') {
            if (toolCall.custom.name === 'error_tool') {
              return toolCall.custom.input;
            }

            return '';
          }

          return `${ParseStream.START_TOOL_CALL}
        ${JSON.stringify(toolCall.function)}
        ${ParseStream.END_TOOL_CALL}`;
        }) || [];

      return {
        ...other,
        content: content
          ? `${content}\n${toolCallstr.join('\n')}`
          : toolCallstr.join('\n'),
      };
    });
  }

  private normalChoiceToHasTool(
    response: OpenAI.Chat.Completions.ChatCompletion
  ) {
    response.choices.forEach((item) => {
      item.message.content = item.message.content || '';

      while (true) {
        const match = item.message.content.match(
          ParseStream.TOOL_CALL_REGEX
        ) as RegExpMatchArray | null;
        if (!match) break;

        item.message.content = item.message.content.replace(match[0], '');
        try {
          const toolCall = JSON.parse(match[1]);
          if (
            toolCall.arguments !== undefined &&
            typeof toolCall.arguments !== 'string'
          ) {
            toolCall.arguments = JSON.stringify(toolCall.arguments);
          }

          if (!item.message.tool_calls) {
            item.message.tool_calls = [];
          }
          item.message.tool_calls.push({
            id: randomUUID(),
            type: 'function',
            function: toolCall,
          });
        } catch (error) {}
      }
    });
  }
}
