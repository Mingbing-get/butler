import { useState, useEffect } from 'react';
import useTask from './useTask';
import type { AIChat } from '@butler/web-ai';

export default function useFunctionCallList(messageId: string) {
  const [functionCallList, setFunctionCallList] = useState<
    AIChat.AssistantCallWithResult[]
  >([]);
  const task = useTask();

  useEffect(() => {
    const unsubscribe = task.on('change-function-call-list', (event) => {
      if (event.messageId !== messageId) return;

      setFunctionCallList([...event.functionCalls]);
    });

    const toolCallList = task.getFunctionCallList(messageId);
    setFunctionCallList(toolCallList);

    return () => {
      unsubscribe();
    };
  }, [messageId]);

  return functionCallList;
}
