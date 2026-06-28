import { HttpException, HttpStatus } from '@nestjs/common';

export const EMAIL_NOT_VERIFIED_MESSAGE =
  'Please verify your email before signing in.';

export class AuthEmailNotVerifiedException extends HttpException {
  constructor() {
    super(EMAIL_NOT_VERIFIED_MESSAGE, HttpStatus.UNAUTHORIZED);
  }
}
