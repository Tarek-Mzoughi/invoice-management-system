import { HttpException, HttpStatus } from '@nestjs/common';

export class ReturnNoteUploadNotFoundException extends HttpException {
  constructor() {
    super('ReturnNote upload not found', HttpStatus.NOT_FOUND);
  }
}
