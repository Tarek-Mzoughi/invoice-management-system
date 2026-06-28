import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomerOrderMetaDataNotFoundException extends HttpException {
  constructor() {
    super('CustomerOrder Meta Data not found', HttpStatus.NOT_FOUND);
  }
}
