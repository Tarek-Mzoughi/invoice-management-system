import { HttpException, HttpStatus } from '@nestjs/common';

export class GoodsIssueNoteSequentialNotFoundException extends HttpException {
  constructor() {
    super('sequence.errors.goods_issue_note_missing', HttpStatus.BAD_REQUEST);
  }
}
