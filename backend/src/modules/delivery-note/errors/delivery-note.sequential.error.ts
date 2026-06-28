import { HttpException, HttpStatus } from '@nestjs/common';

export class DeliveryNoteSequentialNotFoundException extends HttpException {
  constructor() {
    super('sequence.errors.delivery_note_missing', HttpStatus.BAD_REQUEST);
  }
}
