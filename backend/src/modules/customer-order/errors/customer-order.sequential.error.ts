import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomerOrderSequentialNotFoundException extends HttpException {
  constructor() {
    super('sequence.errors.customerOrder_missing', HttpStatus.BAD_REQUEST);
  }
}
