import useFunctionCall from '@/hooks/useFunctionCall';
import ReRender from './reRender';
import RenderResult from './result';

import './index.scss';

interface Props {
  messageId: string;
  functionCallId: string;
}

export default function RenderFunctionCall({
  messageId,
  functionCallId,
}: Props) {
  const functionCall = useFunctionCall(messageId, functionCallId);

  if (!functionCall) {
    return null;
  }

  return (
    <div className="ai-chart-function-call">
      {functionCall.result?.type === 'render' ? (
        <ReRender functionCall={functionCall} />
      ) : (
        <RenderResult functionCall={functionCall} />
      )}
    </div>
  );
}
