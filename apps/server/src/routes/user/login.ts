import { Middleware } from '@koa/router';
import dotenv from 'dotenv';

import db from '../../db';
import { signJwt } from '../../middleware/jwt';
import { compare } from '../../utils/crypto';
import { User, Role, InJwtUser } from '../../type';
import { USER_TABLE_NAME, ROLE_TABLE_NAME } from '../../consts';

dotenv.config();

const login: Middleware = async (ctx) => {
  const { username, password } = ctx.request.body as {
    username: string;
    password: string;
  };

  if (!username || !password) {
    ctx.body = {
      code: 400,
      message: 'username and password are required',
    };
    return;
  }

  const user = await db<User>(USER_TABLE_NAME)
    .where('name', '=', username)
    .first('id', 'name', 'nickName', 'password', 'status');

  if (!user) {
    ctx.body = {
      code: 400,
      message: 'username or password is invalid',
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

  const isPasswordValid = compare(user.password, password);

  if (!isPasswordValid) {
    ctx.body = {
      code: 400,
      message: 'username or password is invalid',
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

export default login;
