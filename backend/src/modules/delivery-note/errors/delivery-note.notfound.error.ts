import { HttpException, HttpStatus } from '@nestjs/common';

export class DeliveryNoteNotFoundException extends HttpException {
  constructor() {
    super('DeliveryNote not found', HttpStatus.NOT_FOUND);
  }
}
