import { HttpException, HttpStatus } from '@nestjs/common';

export class FirmBankAccountCannotBeDeletedException extends HttpException {
  constructor() {
    super('Bank Account cannot be deleted', HttpStatus.FORBIDDEN);
  }
}
