import { HttpException, HttpStatus } from '@nestjs/common';

export class CreditNoteMetaDataNotFoundException extends HttpException {
  constructor() {
    super('CreditNote Meta Data not found', HttpStatus.NOT_FOUND);
  }
}
