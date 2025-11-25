import { useEffect, useMemo, useRef } from 'react';
import { Task, type AIChat } from '@ai-nucl/web-ai';

import { TaskContext } from '../context/task';

interface Props {
  transporter: AIChat.Task.Transporter;
  pickToolNames?: AIChat.FunctionTool.PluginName[];
  children?: React.ReactNode;
}

export default function AIChatProvider({
  transporter,
  pickToolNames,
  children,
}: Props) {
  const task = useRef(new Task(pickToolNames, transporter));

  useEffect(() => {
    task.current.setPickToolNames(pickToolNames);
  }, [pickToolNames]);

  useEffect(() => {
    task.current.setTransporter(transporter);
  }, [transporter]);

  const providerValue = useMemo(() => ({ task: task.current }), []);

  return (
    <TaskContext.Provider value={providerValue}>
      {children}
    </TaskContext.Provider>
  );
}
