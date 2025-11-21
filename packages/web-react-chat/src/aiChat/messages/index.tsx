import { useRef, useCallback, useEffect } from 'react';
import useMessageList from '@/hooks/useMessageList';
import useStaskStatus from '@/hooks/useTaskStatus';

import RenderAssistantMessage from './renderAssistant';
import RenderUserMessage from './renderUser';
import './index.scss';

export default function Messages() {
  const autoScroll = useRef(true);
  const wrapper = useRef<HTMLDivElement>(null);
  const messageList = useMessageList();
  const status = useStaskStatus();
  const statusRef = useRef(status);

  const observer = useRef(
    new MutationObserver(() => {
      if (!autoScroll.current || statusRef.current !== 'running') return;

      wrapper.current?.scrollTo({
        top: wrapper.current.scrollHeight,
        behavior: 'smooth',
      });
    })
  );

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (!wrapper.current) return;

    observer.current.observe(wrapper.current, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.current.disconnect();
  }, [wrapper.current]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!wrapper.current || !e.isTrusted) return;

    autoScroll.current =
      Math.abs(
        wrapper.current.scrollHeight -
          wrapper.current.scrollTop -
          wrapper.current.clientHeight
      ) < 1;
  }, []);

  return (
    <div className="ai-chart-messages" ref={wrapper} onScroll={handleScroll}>
      {messageList.map((message) =>
        message.role === 'assistant' ? (
          <RenderAssistantMessage key={message.id} messageId={message.id} />
        ) : message.role === 'user' ? (
          <RenderUserMessage key={message.id} messageId={message.id} />
        ) : null
      )}
    </div>
  );
}
