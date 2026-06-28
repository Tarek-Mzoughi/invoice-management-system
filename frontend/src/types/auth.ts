import { Gender, ResponseUserDto } from './user';

export interface SigninPayload {
  usernameOrEmail: string;
  password: string;
}

export interface SignupPayload {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: Date | string;
  profilePictureId?: number;
  phone?: string;
  cin?: string;
  bio?: string;
  gender?: Gender;
  isPrivate?: boolean;
  password: string;
}

export interface ResponseSigninDto {
  user: ResponseUserDto;
  access_token: string;
  refresh_token: string;
  mustChangePassword?: boolean;
}

export interface ResponseSignupDto {
  user: ResponseUserDto;
  message?: string;
}

export interface AuthMessageResponse {
  message: string;
  success?: boolean;
}
