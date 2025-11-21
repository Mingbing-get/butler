import { useEffect, useState } from 'react';

import type { AIChat } from '@butler/web-ai';
import useTask from './useTask';

export default function useMessageList() {
  const task = useTask();
  const [messages, setMessages] = useState<AIChat.ChatMessage[]>([]);

  useEffect(() => {
    const unsubscribe = task.on('change-message-list', (event) => {
      setMessages([...event.messages]);
    });

    setMessages(task.getMessages());

    return () => {
      unsubscribe();
    };
  }, []);

  return messages;
}
