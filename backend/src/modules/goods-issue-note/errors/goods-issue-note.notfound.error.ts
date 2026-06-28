import { HttpException, HttpStatus } from '@nestjs/common';

export class GoodsIssueNoteNotFoundException extends HttpException {
  constructor() {
    super('GoodsIssueNote not found', HttpStatus.NOT_FOUND);
  }
}
