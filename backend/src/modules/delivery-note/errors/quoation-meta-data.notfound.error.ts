import { HttpException, HttpStatus } from '@nestjs/common';

export class DeliveryNoteMetaDataNotFoundException extends HttpException {
  constructor() {
    super('DeliveryNote Meta Data not found', HttpStatus.NOT_FOUND);
  }
}
