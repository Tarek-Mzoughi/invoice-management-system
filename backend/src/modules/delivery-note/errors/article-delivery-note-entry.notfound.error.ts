import { HttpException, HttpStatus } from '@nestjs/common';

export class ArticleDeliveryNoteEntryNotFoundException extends HttpException {
  constructor() {
    super('Article DeliveryNote Entry not found', HttpStatus.NOT_FOUND);
  }
}
