import Router from '@koa/router';

const healthRouter = new Router();

healthRouter.get('/', async (ctx) => {
  ctx.body = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
  };
});

export default healthRouter;
