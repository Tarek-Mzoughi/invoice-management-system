import { describe, expect, it } from 'vitest';
import {
  EMAIL_NOT_VERIFIED_MESSAGE,
  EMAIL_VERIFICATION_PROMPT,
  isEmailNotVerifiedError,
  RESEND_VERIFICATION_LABEL
} from './auth-verification';

describe('isEmailNotVerifiedError', () => {
  it('recognizes the API error that enables the resend action', () => {
    expect(isEmailNotVerifiedError(EMAIL_NOT_VERIFIED_MESSAGE)).toBe(true);
  });

  it('recognizes the verification message when wrapped by authentication', () => {
    expect(isEmailNotVerifiedError(`CredentialsSignin: ${EMAIL_NOT_VERIFIED_MESSAGE}`)).toBe(true);
  });

  it('does not enable the resend action for invalid credentials', () => {
    expect(isEmailNotVerifiedError('Invalid credentials')).toBe(false);
  });

  it('provides the verification message and resend action labels', () => {
    expect(EMAIL_VERIFICATION_PROMPT).toBe('Please verify your email address before signing in.');
    expect(RESEND_VERIFICATION_LABEL).toBe('Resend verification email');
  });
});
