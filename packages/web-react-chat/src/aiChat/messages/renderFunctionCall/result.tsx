import { useMemo, useState } from 'react';
import classNames from 'classnames';

import type { AIChat } from '@butler/web-ai';

interface Props {
  functionCall: AIChat.AssistantCallWithResult;
}

export default function RenderResult({ functionCall }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const result = useMemo(() => {
    if (functionCall.result?.type !== 'result') return;

    const content = functionCall.result.content;
    if (!content || typeof content === 'string') {
      return content;
    }

    return JSON.stringify(content, null, 2);
  }, [functionCall.result]);

  if (functionCall.result?.type === 'render') {
    return null;
  }

  return (
    <>
      <div
        className={classNames('ai-chart-function-call-title', {
          'is-expanded': isExpanded,
          'is-loading': functionCall.running,
        })}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="title-arrow" />
        <span>{functionCall.define.function.name}</span>
      </div>
      {isExpanded && (
        <div className="ai-chart-function-call-result">
          <pre>
            {JSON.stringify(functionCall.define.function.arguments, null, 2)}
          </pre>
          {result && <pre>{result}</pre>}
        </div>
      )}
    </>
  );
}
