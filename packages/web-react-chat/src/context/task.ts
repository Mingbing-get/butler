import { createContext } from 'react';

import { Task } from '@butler/web-ai';

export const TaskContext = createContext<{
  task: Task;
}>({
  task: new Task(),
});
