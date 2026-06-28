import { HttpException, HttpStatus } from '@nestjs/common';

export class FirmBankAccountAlreadyExistsException extends HttpException {
  constructor() {
    super('Bank Account already exists', HttpStatus.CONFLICT);
  }
}
