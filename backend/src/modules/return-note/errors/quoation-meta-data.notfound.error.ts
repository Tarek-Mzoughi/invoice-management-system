import { HttpException, HttpStatus } from '@nestjs/common';

export class ReturnNoteMetaDataNotFoundException extends HttpException {
  constructor() {
    super('ReturnNote Meta Data not found', HttpStatus.NOT_FOUND);
  }
}
