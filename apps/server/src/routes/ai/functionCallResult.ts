import { Middleware } from '@koa/router';

import { taskMap } from './task';

const functionCallResult: Middleware = async (ctx) => {
  const { taskId, callId, result } = ctx.request.body as {
    taskId: string;
    callId: string;
    result: any;
  };
  const task = taskMap.get(taskId);
  if (!task) {
    ctx.status = 404;
    ctx.body = { message: 'Task not found' };
    return;
  }
  task.resolveToolCall(callId, result);
  ctx.body = { message: 'success' };
};

export default functionCallResult;
