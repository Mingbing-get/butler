import { useState, useEffect } from 'react';
import useTask from './useTask';
import type { AIChat } from '@butler/web-ai';

export default function useFunctionCall(messageId: string, callId: string) {
  const [functionCall, setFunctionCall] =
    useState<AIChat.AssistantCallWithResult>();
  const task = useTask();

  useEffect(() => {
    const unsubscribe = task.on('change-function-call', (event) => {
      if (
        event.messageId !== messageId ||
        event.functionCall.define.id !== callId
      )
        return;

      setFunctionCall({ ...event.functionCall });
    });

    const functionCall = task.getFunctionCallById(messageId, callId);
    setFunctionCall(functionCall);

    return () => {
      unsubscribe();
    };
  }, [messageId]);

  return functionCall;
}
