import { HttpException, HttpStatus } from '@nestjs/common';

export class InvoiceSequentialNotFoundException extends HttpException {
  constructor() {
    super('sequence.errors.invoice_missing', HttpStatus.BAD_REQUEST);
  }
}
