import { HttpException, HttpStatus } from '@nestjs/common';

export class ArticleReturnNoteEntryNotFoundException extends HttpException {
  constructor() {
    super('Article ReturnNote Entry not found', HttpStatus.NOT_FOUND);
  }
}
