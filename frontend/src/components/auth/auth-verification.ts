export const EMAIL_NOT_VERIFIED_MESSAGE = 'Please verify your email before signing in.';
export const EMAIL_VERIFICATION_PROMPT = 'Please verify your email address before signing in.';
export const RESEND_VERIFICATION_LABEL = 'Resend verification email';
export const RESEND_VERIFICATION_PENDING_LABEL = 'Sending...';

export const isEmailNotVerifiedError = (message: string): boolean =>
  message === EMAIL_NOT_VERIFIED_MESSAGE || message.toLowerCase().includes('verify your email');
