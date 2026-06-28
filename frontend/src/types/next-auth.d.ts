import { DefaultUser } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface User extends DefaultUser {
    access_token?: string;
    refresh_token?: string;
    mustChangePassword?: boolean;
  }

  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    access_token?: string;
    refresh_token?: string;
    mustChangePassword?: boolean;
  }
}
