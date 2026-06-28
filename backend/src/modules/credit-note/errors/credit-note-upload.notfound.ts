import { HttpException, HttpStatus } from '@nestjs/common';

export class CreditNoteUploadNotFoundException extends HttpException {
  constructor() {
    super('CreditNote upload not found', HttpStatus.NOT_FOUND);
  }
}
