import { Middleware } from '@koa/router';
import { sign, decode, JwtPayload } from 'jsonwebtoken';

import { InJwtUser } from '../type/user';

export function signJwt(data: any) {
  return sign(data, process.env.JWT_SECRET || '', { expiresIn: '24h' });
}

export const jwtVerify: Middleware = async (ctx, next) => {
  const wUser = ctx.request.headers['nucl-user'] as string;
  const jwtPayload = decode(wUser);

  if (jwtPayload && !isExp(jwtPayload as JwtPayload)) {
    const user = (jwtPayload as JwtPayload).user as InJwtUser;

    ctx.state.user = user;
    await next();
  } else {
    ctx.status = 401;
    ctx.body = { code: 401, message: 'Unauthorized' };
  }
};

export function isExp(jwtPayload: JwtPayload) {
  if (!jwtPayload.exp) return false;

  return jwtPayload.exp * 1000 <= new Date().getTime();
}
