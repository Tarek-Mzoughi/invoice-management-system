import { HttpException, HttpStatus } from '@nestjs/common';

export class CreditNoteNotFoundException extends HttpException {
  constructor() {
    super('CreditNote not found', HttpStatus.NOT_FOUND);
  }
}
