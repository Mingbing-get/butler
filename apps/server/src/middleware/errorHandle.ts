import { Middleware } from '@koa/router';

const errorHandle: Middleware = async (ctx, next) => {
  try {
    await next();
  } catch (err: any) {
    ctx.body = {
      code: 500,
      message: '未知错误',
    };
  }
};

export default errorHandle;
