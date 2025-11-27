import { Middleware } from '@koa/router';

export const superAdminVerify: Middleware = async (ctx, next) => {
  if (ctx.state.user.isSuperAdmin) {
    await next();
  } else {
    ctx.status = 401;
    ctx.body = { code: 401, message: 'Unauthorized' };
  }
};
