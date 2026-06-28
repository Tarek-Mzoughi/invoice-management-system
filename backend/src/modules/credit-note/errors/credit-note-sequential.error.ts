import { HttpException, HttpStatus } from '@nestjs/common';

export class CreditNoteSequentialNotFoundException extends HttpException {
  constructor() {
    super('sequence.errors.credit_note_missing', HttpStatus.BAD_REQUEST);
  }
}
