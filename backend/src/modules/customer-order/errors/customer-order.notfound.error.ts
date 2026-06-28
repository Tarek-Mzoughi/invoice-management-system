import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomerOrderNotFoundException extends HttpException {
  constructor() {
    super('CustomerOrder not found', HttpStatus.NOT_FOUND);
  }
}
