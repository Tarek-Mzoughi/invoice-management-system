import { HttpException, HttpStatus } from '@nestjs/common';

export class ArticleCreditNoteEntryNotFoundException extends HttpException {
  constructor() {
    super('Article CreditNote Entry not found', HttpStatus.NOT_FOUND);
  }
}
