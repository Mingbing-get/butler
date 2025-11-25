import { useCallback, useMemo, useState } from 'react';
import classNames from 'classnames';

import useTask from '../../hooks/useTask';
import useTaskStatus from '../../hooks/useTaskStatus';
import useMessageList from '../../hooks/useMessageList';
import SendIcon from './icons/send';
import MagicStickIcon from './icons/magicStick';
import CompressionIcon from './icons/compression';
import StopIcon from './icons/stop';

import './index.scss';

export default function Action() {
  const [inputValue, setInputValue] = useState('');
  const task = useTask();
  const status = useTaskStatus();
  const messageList = useMessageList();
  const [prefPromptLoading, setPrefPromptLoading] = useState(false);
  const [compressionLoading, setCompressionLoading] = useState(false);

  const handleSend = useCallback(async () => {
    await task.send(inputValue);
    setInputValue('');
  }, [inputValue]);

  const handlePrefPrompt = useCallback(async () => {
    if (!inputValue) return;

    const transporter = task.getTransporter();
    if (!transporter) return;

    setPrefPromptLoading(true);
    const text = await transporter.simpleChart({
      prompt: inputValue,
      historyMessages: [
        {
          id: '',
          role: 'system',
          content:
            '你是一个专业的提示词优化器，优化用户输入的提示词，使得其提示词表达更加清晰明确，将提示词优化成按步骤执行的提示词；只需要生成优化后的提示词，不需要添加任何解释。',
        },
      ],
    });
    setInputValue(text);
    setPrefPromptLoading(false);
  }, [inputValue]);

  const handleCompression = useCallback(async () => {
    const historyMessages = task.toHistoryMessage();
    if (historyMessages.length <= 1) return;

    const transporter = task.getTransporter();
    if (!transporter) return;

    setCompressionLoading(true);
    const text = await transporter.simpleChart({
      prompt:
        '帮我总结一下最近的对话，仅保留主要的对话内容，结果尽量精简；注意不要生成任何与对话无关的信息，不需要添加任何解释。',
      historyMessages: historyMessages,
    });
    task.addSystemMessage(`以下是历史对话总结：${text}`, true);
    setCompressionLoading(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!inputValue) return;

      if (e.key === 'Enter') {
        if (
          e.nativeEvent.isComposing ||
          e.shiftKey ||
          e.ctrlKey ||
          e.altKey ||
          e.metaKey
        )
          return;

        handleSend();
        e.preventDefault();
      }
    },
    [inputValue, handleSend]
  );

  const handleSendOrStop = useCallback(() => {
    if (status === 'running') {
      task.stop();
    } else {
      handleSend();
    }
  }, [status, handleSend]);

  const canCompression = useMemo(() => {
    if (messageList.length <= 1) return false;

    const lastMessage = messageList[messageList.length - 1];

    return lastMessage.role !== 'system' && lastMessage.role !== 'developer';
  }, [messageList]);

  return (
    <div className="ai-chart-action">
      <textarea
        rows={2}
        className="ai-chart-action-input"
        disabled={status === 'running'}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="action-buttons">
        <button
          className={classNames('ai-chart-action-button', {
            'is-loading': compressionLoading,
          })}
          disabled={
            !canCompression || compressionLoading || status === 'running'
          }
          onClick={handleCompression}
        >
          <CompressionIcon />
        </button>
        <button
          className={classNames('ai-chart-action-button', {
            'is-loading': prefPromptLoading,
          })}
          disabled={!inputValue || prefPromptLoading || status === 'running'}
          onClick={handlePrefPrompt}
        >
          <MagicStickIcon />
        </button>
        <button
          className="ai-chart-action-button"
          disabled={!inputValue && status !== 'running'}
          onClick={handleSendOrStop}
        >
          {status === 'running' ? <StopIcon /> : <SendIcon />}
        </button>
      </div>
    </div>
  );
}
