import Koa from 'koa';
import cors from '@koa/cors';
import Router from '@koa/router';
import koaBody from 'koa-body';

import init from './init';

import aiRouter from './routes/ai';
import healthRouter from './routes/health';

main();

async function main() {
  console.log('初始化应用数据.');
  await init();
  console.log('应用数据初始化完成.');

  // 创建Koa应用实例
  const app = new Koa();

  // 配置CORS中间件
  app.use(cors());

  // 配置koa-body中间件
  app.use(koaBody());

  // 使用路由中间件
  const router = new Router();
  router.use('/health', healthRouter.routes(), healthRouter.allowedMethods());
  router.use('/ai', aiRouter.routes(), aiRouter.allowedMethods());
  app.use(router.routes()).use(router.allowedMethods());

  // 错误处理中间件
  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err: any) {
      ctx.status = err.status || 500;
      ctx.body = {
        error: err.message || 'Internal Server Error',
      };
    }
  });

  // 启动服务器
  const PORT = process.env.PORT || 3100;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
