import Router from 'koa-router';
import { sign, decode, JwtPayload } from 'jsonwebtoken';
import { InJwtUser } from '../type/user';

export function signJwt(data: any) {
  return sign(data, process.env.JWT_SECRET || '', { expiresIn: '24h' });
}

export const jwtVerify: Router.IMiddleware<{
  user: InJwtUser;
}> = async (ctx, next) => {
  const wUser = ctx.request.headers['nucl-user'] as string;
  const jwtPayload = decode(wUser);

  if (jwtPayload && !isExp(jwtPayload as JwtPayload)) {
    const user = (jwtPayload as JwtPayload).user as InJwtUser;

    ctx.state.user = user;
    await next();
  }
};

export function isExp(jwtPayload: JwtPayload) {
  if (!jwtPayload.exp) return false;

  return jwtPayload.exp * 1000 <= new Date().getTime();
}
