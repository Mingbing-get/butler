import useMessageContent from '@/hooks/useMessageContent';
import MarkdownRender from '@/markdownRender';

interface Props {
  messageId: string;
}

export default function RenderUserMessage({ messageId }: Props) {
  const content = useMessageContent(messageId);

  return (
    <div className="ai-chart-user-message">
      <MarkdownRender>{content}</MarkdownRender>
    </div>
  );
}
