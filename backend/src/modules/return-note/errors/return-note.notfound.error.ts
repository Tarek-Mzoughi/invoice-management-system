import { HttpException, HttpStatus } from '@nestjs/common';

export class ReturnNoteNotFoundException extends HttpException {
  constructor() {
    super('ReturnNote not found', HttpStatus.NOT_FOUND);
  }
}
