import MarkdownRender from '@/markdownRender';

import useMessageContent from '@/hooks/useMessageContent';
import useMessageRunning from '@/hooks/useMessageRunning';
import useFunctionCallList from '@/hooks/useFunctionCallList';

import RenderFunctionCall from './renderFunctionCall';
import { useMemo } from 'react';

interface Props {
  messageId: string;
}

export default function RenderAssistantMessage({ messageId }: Props) {
  const content = useMessageContent(messageId);
  const isRunning = useMessageRunning(messageId);
  const functionCalls = useFunctionCallList(messageId);
  const runningContent = '<span class="is-running"></span>';

  const hiddenMessage = useMemo(() => {
    return !isRunning && !content;
  }, [content, isRunning]);

  return (
    <>
      {!hiddenMessage && (
        <div className="ai-chart-assistant-message">
          <MarkdownRender>{`${content}${isRunning ? runningContent : ''}`}</MarkdownRender>
        </div>
      )}
      {functionCalls.map((functionCall) => (
        <RenderFunctionCall
          key={functionCall.define.id}
          messageId={messageId}
          functionCallId={functionCall.define.id}
        />
      ))}
    </>
  );
}
