import Router from '@koa/router';

import { jwtVerify } from '../../middleware/jwt';
import login from './login';
import autoAuth from './autoAuth';

const userRouter = new Router();

userRouter.post('/login', login);
userRouter.post('/autoAuth', jwtVerify, autoAuth);

export default userRouter;
