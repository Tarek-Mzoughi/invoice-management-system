import {
  AuthMessageResponse,
  ResponseSigninDto,
  ResponseSignupDto,
  SigninPayload,
  SignupPayload
} from '@/types';
import axios from './axios';

const optionalString = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const optionalDate = (value?: Date | string): string | undefined => {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
};

const signIn = async (payload: SigninPayload): Promise<ResponseSigninDto> => {
  const response = await axios.post<ResponseSigninDto>('/auth/sign-in', payload);
  return response.data;
};

const signUp = async (payload: SignupPayload): Promise<ResponseSignupDto> => {
  const response = await axios.post<ResponseSignupDto>('/auth/register', {
    username: payload.username.trim(),
    email: payload.email.trim(),
    password: payload.password,
    firstName: optionalString(payload.firstName),
    lastName: optionalString(payload.lastName),
    dateOfBirth: optionalDate(payload.dateOfBirth),
    profilePictureId: payload.profilePictureId,
    phone: optionalString(payload.phone),
    cin: optionalString(payload.cin),
    bio: optionalString(payload.bio),
    gender: payload.gender,
    isPrivate: payload.isPrivate
  });
  return response.data;
};

const forgetPassword = async (payload: {
  usernameOrEmail: string;
}): Promise<AuthMessageResponse> => {
  const response = await axios.post<AuthMessageResponse>('/auth/forgot-password', payload);
  return response.data;
};

const checkResetToken = async (
  token: string
): Promise<{ token: string; valid: boolean }> => {
  const response = await axios.post<{ token: string; valid: boolean }>(
    '/auth/check-reset-token',
    { token }
  );
  return response.data;
};

const resetPassword = async (token: string, password: string): Promise<{ message: string }> => {
  const response = await axios.post<{ message: string }>('/auth/reset-password', {
    token,
    password
  });
  return response.data;
};

const verifyEmail = async (token: string): Promise<{ message: string }> => {
  const response = await axios.post<{ message: string }>('/auth/verify-email', { token });
  return response.data;
};

const resendVerification = async (
  usernameOrEmail: string
): Promise<AuthMessageResponse> => {
  const response = await axios.post<AuthMessageResponse>('/auth/resend-verification', {
    usernameOrEmail
  });
  return response.data;
};

export const auth = {
  signIn,
  signUp,
  forgetPassword,
  checkResetToken,
  resetPassword,
  verifyEmail,
  resendVerification
};
