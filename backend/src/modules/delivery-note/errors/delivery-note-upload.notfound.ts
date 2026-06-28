import { HttpException, HttpStatus } from '@nestjs/common';

export class DeliveryNoteUploadNotFoundException extends HttpException {
  constructor() {
    super('DeliveryNote upload not found', HttpStatus.NOT_FOUND);
  }
}
