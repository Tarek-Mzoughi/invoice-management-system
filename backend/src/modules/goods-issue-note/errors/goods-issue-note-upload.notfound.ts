import { HttpException, HttpStatus } from '@nestjs/common';

export class GoodsIssueNoteUploadNotFoundException extends HttpException {
  constructor() {
    super('GoodsIssueNote upload not found', HttpStatus.NOT_FOUND);
  }
}
