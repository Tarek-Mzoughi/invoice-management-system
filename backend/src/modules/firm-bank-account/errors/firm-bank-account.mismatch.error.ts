import { HttpException, HttpStatus } from '@nestjs/common';

export class FirmBankAccountInformationsMismatchException extends HttpException {
  constructor() {
    super('IBAN & RIB does not match is duplicated', HttpStatus.CONFLICT);
  }
}
