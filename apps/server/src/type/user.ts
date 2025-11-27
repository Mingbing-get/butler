export interface User {
  id: number;
  name: string;
  nickName?: string;
  password: string;
  status: 'active' | 'inactive';
}

export interface WithoutPasswordUser extends Omit<User, 'password'> {}

export interface InJwtUser extends WithoutPasswordUser {
  roles: number[];
  isSuperAdmin?: boolean;
}
