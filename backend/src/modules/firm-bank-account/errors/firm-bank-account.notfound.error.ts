import { HttpException, HttpStatus } from '@nestjs/common';

export class FirmBankAccountNotFoundException extends HttpException {
  constructor() {
    super('Bank Account not found', HttpStatus.NOT_FOUND);
  }
}
