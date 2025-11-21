import classNames from 'classnames';
import type { AIChat } from '@butler/web-ai';

import Messages from './messages';
import Action from './action';
import Provider from './provider';

import './index.scss';

interface Props {
  transporter: AIChat.Task.Transporter;
  className?: string;
  style?: React.CSSProperties;
  pickToolNames?: AIChat.FunctionTool.PluginName[];
}

export default function AIChatRender({
  transporter,
  className,
  style,
  pickToolNames,
}: Props) {
  return (
    <Provider transporter={transporter} pickToolNames={pickToolNames}>
      <div className={classNames('ai-chart', className)} style={style}>
        <Messages />
        <Action />
      </div>
    </Provider>
  );
}
