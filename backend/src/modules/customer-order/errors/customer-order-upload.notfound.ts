import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomerOrderUploadNotFoundException extends HttpException {
  constructor() {
    super('CustomerOrder upload not found', HttpStatus.NOT_FOUND);
  }
}
