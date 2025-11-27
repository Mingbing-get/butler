import Router from '@koa/router';

import { jwtVerify } from '../../middleware/jwt';

import generateText from './generateText';
import task from './task';
import functionCallResult from './functionCallResult';

const aiRouter = new Router();

aiRouter.use(jwtVerify);

aiRouter.post('/generateText', generateText);
aiRouter.post('/task', task);
aiRouter.post('/functionCallResult', functionCallResult);

export default aiRouter;
