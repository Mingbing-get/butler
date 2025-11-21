import type { AIChat } from './type';

export interface FunctionToolExecuteResult {
  type: 'result';
  content?: any;
}

export interface FunctionToolRenderResult {
  type: 'render';
  content?: any;
}

export type FunctionToolResult =
  | FunctionToolExecuteResult
  | FunctionToolRenderResult;

export class ToolManager {
  private tools: AIChat.FunctionTool[] = [];
  private toolInstance: Record<string, AIChat.FunctionToolInstance> = {};
  private waitExecute = new Map<
    string,
    (value: FunctionToolRenderResult) => void
  >();

  add(
    func: AIChat.FunctionTool['function'],
    instance: AIChat.FunctionToolInstance
  ) {
    this.tools.push({
      type: 'function',
      function: func,
    });
    this.toolInstance[func.name] = instance;

    return this;
  }

  async executeToolCall(
    call: AIChat.FunctionToolCall
  ): Promise<FunctionToolResult> {
    const instance = this.toolInstance[call.function.name];
    if (!instance) {
      return {
        type: 'result',
        content: `Tool ${call.function.name} not found`,
      };
    }

    if (instance.type === 'function-execute') {
      return {
        type: 'result',
        content: await instance.fn(call.function.arguments),
      };
    }

    if (instance.reportName) {
      return new Promise<FunctionToolRenderResult>((resolve) => {
        this.waitExecute.set(call.id, resolve);
      });
    }

    return {
      type: 'render',
    };
  }

  reportToolCallResult(id: string, content: any) {
    const resolve = this.waitExecute.get(id);
    if (!resolve) return;

    resolve({
      type: 'render',
      content,
    });
    this.waitExecute.delete(id);
  }

  getTools(pickToolNames?: AIChat.FunctionTool.PluginName[]) {
    if (!pickToolNames) {
      return this.tools;
    }
    return this.tools.filter((tool) =>
      pickToolNames.includes(tool.function.name)
    );
  }

  hasTool(name: string) {
    return this.tools.some((tool) => tool.function.name === name);
  }

  getToolInstance(name: string) {
    return this.toolInstance[name];
  }

  getTool(name: string) {
    return this.tools.find((tool) => tool.function.name === name);
  }
}

export default new ToolManager();
