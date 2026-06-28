import { HttpException, HttpStatus } from '@nestjs/common';

export class QuotationSequentialNotFoundException extends HttpException {
  constructor() {
    super('sequence.errors.quotation_missing', HttpStatus.BAD_REQUEST);
  }
}
