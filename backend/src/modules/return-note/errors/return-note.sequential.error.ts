import { HttpException, HttpStatus } from '@nestjs/common';

export class ReturnNoteSequentialNotFoundException extends HttpException {
  constructor() {
    super('sequence.errors.return_note_missing', HttpStatus.BAD_REQUEST);
  }
}
