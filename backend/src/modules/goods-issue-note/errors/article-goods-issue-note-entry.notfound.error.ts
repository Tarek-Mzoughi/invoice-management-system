import { HttpException, HttpStatus } from '@nestjs/common';

export class ArticleGoodsIssueNoteEntryNotFoundException extends HttpException {
  constructor() {
    super('Article GoodsIssueNote Entry not found', HttpStatus.NOT_FOUND);
  }
}
