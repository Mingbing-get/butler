import Koa from 'koa';
import cors from '@koa/cors';
import koaBody from 'koa-body';
import mount from 'koa-mount';
import koaStatic from 'koa-static';
import { join } from 'path';

import init from './init';

import errorHandle from './middleware/errorHandle';
import userRouter from './routes/user';
import aiRouter from './routes/ai';

import './global.d.ts';

main();

async function main() {
  // console.log('初始化应用数据.');
  // await init();
  // console.log('应用数据初始化完成.');

  // 创建Koa应用实例
  const app = new Koa();

  // 配置CORS中间件
  app.use(cors());

  // 配置koa-body中间件
  app.use(koaBody());

  // 错误处理中间件
  app.use(errorHandle);
  app.use(
    mount(
      '/public',
      koaStatic(join(process.cwd(), 'public'), {
        maxAge: 365 * 24 * 60 * 60 * 1000,
      })
    )
  );
  app.use(mount('/ai', aiRouter.routes()));
  app.use(mount('/user', userRouter.routes()));

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
