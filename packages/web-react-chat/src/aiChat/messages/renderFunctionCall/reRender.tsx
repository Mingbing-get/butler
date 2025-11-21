import { toolManager, type AIChat } from '@butler/web-ai';
import { useMemo } from 'react';

interface Props {
  functionCall: AIChat.AssistantCallWithResult;
}

export default function ReRender({ functionCall }: Props) {
  const info = useMemo(() => {
    const tool = toolManager.getToolInstance(functionCall.define.function.name);

    if (tool?.type !== 'function-render') return;

    const props = {
      ...functionCall.define.function.arguments,
    };
    if (tool.reportResultName) {
      props[tool.reportResultName] = functionCall.result?.content;
    }
    if (tool.reportName) {
      props[tool.reportName] = (content: any) => {
        toolManager.reportToolCallResult(functionCall.define.id, content);
      };
    }

    return {
      Render: tool.render,
      props,
    };
  }, [functionCall]);

  if (!info) return null;

  return <info.Render {...info.props} />;
}
