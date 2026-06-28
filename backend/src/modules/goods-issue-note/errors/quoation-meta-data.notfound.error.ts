import { HttpException, HttpStatus } from '@nestjs/common';

export class GoodsIssueNoteMetaDataNotFoundException extends HttpException {
  constructor() {
    super('GoodsIssueNote Meta Data not found', HttpStatus.NOT_FOUND);
  }
}
