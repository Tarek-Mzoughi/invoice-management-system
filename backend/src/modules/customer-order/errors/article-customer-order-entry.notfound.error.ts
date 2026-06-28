import { HttpException, HttpStatus } from '@nestjs/common';

export class ArticleCustomerOrderEntryNotFoundException extends HttpException {
  constructor() {
    super('Article CustomerOrder Entry not found', HttpStatus.NOT_FOUND);
  }
}
