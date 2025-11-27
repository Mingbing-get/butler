import { Middleware } from '@koa/router';

import db from '../../db';
import { User, Role, InJwtUser } from '../../type';
import { USER_TABLE_NAME, ROLE_TABLE_NAME } from '../../consts';
import { signJwt } from '../../middleware/jwt';

const autoAuth: Middleware = async (ctx) => {
  const handler = ctx.state.user;

  const user = await db<User>(USER_TABLE_NAME)
    .where('name', '=', handler.name)
    .first('id', 'name', 'nickName', 'password', 'status');

  if (!user) {
    ctx.body = {
      code: 400,
      message: 'user not found',
    };
    return;
  }

  if (user.status !== 'active') {
    ctx.body = {
      code: 400,
      message: 'user is inactive',
    };
    return;
  }

  const roles = await db<Role>(ROLE_TABLE_NAME)
    .whereJsonSupersetOf('users', `${user.id}`)
    .select('id');

  const jwtUser: InJwtUser = {
    id: user.id,
    name: user.name,
    nickName: user.nickName,
    status: user.status,
    roles: roles.map((role) => role.id),
    isSuperAdmin: process.env.INIT_ADMIN_USERNAME === user.name,
  };

  const jwtToken = signJwt({ user: jwtUser });

  ctx.set('nucl-user', jwtToken);
  ctx.set('Access-Control-Expose-Headers', 'nucl-user');
  ctx.body = { code: 200, message: 'success', data: jwtUser };
};

export default autoAuth;
