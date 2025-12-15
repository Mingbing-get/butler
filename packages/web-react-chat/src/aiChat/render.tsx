import classNames from 'classnames';

import Messages from './messages';
import Action, { ChatActionProps } from './action';

import './index.scss';

interface Props extends ChatActionProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function AIChatRender({
  className,
  style,
  quickQuestions,
}: Props) {
  return (
    <div className={classNames('ai-chart', className)} style={style}>
      <Messages />
      <Action quickQuestions={quickQuestions} />
    </div>
  );
}
