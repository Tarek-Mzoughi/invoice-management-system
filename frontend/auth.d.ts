import 'next-auth';

declare module 'next-auth' {
  interface User {
    access_token: string;
    refresh_token?: string;
    isApproved?: boolean;
  }

  interface Session {
    user: User & import('next-auth').DefaultSession['user'];
  }

  interface Token extends User {}
}

declare module 'next-auth/jwt' {
  interface JWT {
    access_token?: string;
    refresh_token?: string;
    isApproved?: boolean;
  }
}
