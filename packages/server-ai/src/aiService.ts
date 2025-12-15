import { OpenAI } from 'openai';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import Task from './task';
import ParseStream from './parseStream';
import { AiNucl } from './type';

/**
 * OpenAI服务类，封装了与OpenAI API交互的方法
 */
export default class AIService {
  private client: OpenAI;
  private defaultModel: string;
  private supportFunctionCall: boolean;
  private tools: Array<{
    type: 'function';
    function: AiNucl.AiService.WithZodFunctionTool;
  }> = [];
  private toolFunctions: Record<string, AiNucl.AiService.FunctionToolInstance> =
    {};
  private toolFilters: Array<AiNucl.AiService.ToolFilter> = [];

  constructor(options: AiNucl.AiService.Options) {
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
    func: AiNucl.AiService.WithZodFunctionTool,
    functionImpl: AiNucl.AiService.FunctionToolInstance
  ) {
    this.tools.push({
      type: 'function',
      function: func,
    });
    this.toolFunctions[func.name] = functionImpl;

    return this;
  }

  addToolFilter(toolFilter: AiNucl.AiService.ToolFilter) {
    this.toolFilters.push(toolFilter);
    return this;
  }

  async executeFunctionTool(
    toolCall: OpenAI.Chat.Completions.ChatCompletionMessageToolCall,
    context: AiNucl.AiService.Context
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

    // 校验参数
    const functionArgs = JSON.parse(toolCall.function.arguments || '{}');
    if (tool.function.parameters) {
      const res = tool.function.parameters.safeParse(functionArgs);
      if (!res.success) {
        return res.error.issues;
      }
    }

    // 执行工具函数
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
  async createChatCompletion({
    messages,
    extraTools,
    pickToolNames,
    context,
  }: AiNucl.AiService.CreateChatOptions) {
    try {
      const filterTools = await this.getCanUseTool(context, pickToolNames);
      const allTools = [
        ...this.zodParamsToolsToOpenAIParamsTools(filterTools),
        ...(extraTools || []),
      ];

      if (this.supportFunctionCall) {
        return await this.client.chat.completions.create({
          model: this.defaultModel,
          messages: messages,
          tools: allTools,
        });
      }

      const withToolMessages = [...this.messageToNotSuportMessage(messages)];
      if (allTools.length > 0) {
        withToolMessages.unshift(this.toolToSystemMessage(allTools));
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
  async createChatCompletionStream({
    messages,
    extraTools,
    pickToolNames,
    context,
  }: AiNucl.AiService.CreateChatOptions) {
    const filterTools = await this.getCanUseTool(context, pickToolNames);
    const allTools = [
      ...this.zodParamsToolsToOpenAIParamsTools(filterTools),
      ...(extraTools || []),
    ];

    if (this.supportFunctionCall) {
      const stream = this.client.chat.completions.stream({
        model: this.defaultModel,
        messages: messages,
        tools: allTools,
        stream: true,
      });

      return new ParseStream(stream);
    }

    const stream = this.client.chat.completions.stream({
      model: this.defaultModel,
      messages: [
        this.toolToSystemMessage(allTools),
        ...this.messageToNotSuportMessage(messages),
      ],
      stream: true,
    });

    return new ParseStream(stream);
  }

  createTask(options: Omit<AiNucl.Task.Options, 'aiService'>) {
    return new Task({
      ...options,
      aiService: this,
    });
  }

  private async getCanUseTool(
    context: AiNucl.AiService.Context,
    pickToolNames?: Array<AiNucl.AiService.FunctionToolName>
  ): Promise<
    Array<{
      type: 'function';
      function: AiNucl.AiService.WithZodFunctionTool;
    }>
  > {
    let afterFilterTools = this.tools.map((tool) => tool.function);
    for (const filter of this.toolFilters) {
      if (afterFilterTools.length === 0) {
        break;
      }
      afterFilterTools = await filter(afterFilterTools, context);
    }

    if (pickToolNames) {
      return afterFilterTools
        .filter((tool) => pickToolNames.includes(tool.name))
        .map((tool) => ({
          type: 'function',
          function: tool,
        }));
    }

    return afterFilterTools.map((tool) => ({
      type: 'function',
      function: tool,
    }));
  }

  private toolToSystemMessage(
    tools: Array<OpenAI.Chat.Completions.ChatCompletionFunctionTool>
  ): OpenAI.Chat.Completions.ChatCompletionSystemMessageParam {
    const toolStrMap = tools.map((tool) => {
      return `  <tool>
    <toolName>${tool.function.name}</toolName>
    <toolDescription>${tool.function.description}</toolDescription>
    <toolParameters>${JSON.stringify(tool.function.parameters || {}, null, 2)}</toolParameters>
  </tool>`;
    });

    const tip = `你是一个智能助手，可以通过调用工具来回答问题。请遵循以下步骤：
1. 分析用户的问题，确定其意图。
2. 若有需要可从下面的工具列表中选择最合适的工具。
3. 严格按照以下格式输出，不要有任何其他额外说明(注意：仅可选择已提供的工具，arguments必须为一个object，且严格遵循tool的参数定义，若不需要参数也必须返回一个空的object)：

其他非工具的回答(注意, 这里回答的内容不可包含工具信息、不能出现工具名称、参数等)
${ParseStream.START_TOOL_CALL}
{
  "name": "get_weather",
  "arguments": "{\"location\": \"北京\"}"
}
${ParseStream.END_TOOL_CALL}

可用工具：
<tools>
${toolStrMap.join('\n')}
</tools>
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

  private zodParamsToolsToOpenAIParamsTools(
    tools: Array<{
      type: 'function';
      function: AiNucl.AiService.WithZodFunctionTool;
    }>
  ): Array<OpenAI.Chat.Completions.ChatCompletionFunctionTool> {
    return tools.map((tool) => ({
      ...tool,
      function: {
        ...tool.function,
        parameters: tool.function.parameters
          ? z.toJSONSchema(tool.function.parameters)
          : undefined,
      },
    }));
  }
}
