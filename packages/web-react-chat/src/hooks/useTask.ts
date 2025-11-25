import { useContext } from 'react';

import { TaskContext } from '../context/task';

export default function useTask() {
  const context = useContext(TaskContext);

  return context.task;
}
