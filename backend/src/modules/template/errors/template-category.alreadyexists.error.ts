import { HttpException, HttpStatus } from '@nestjs/common';

export class TemplateCategoryAlreadyExistsException extends HttpException {
  constructor() {
    super('Template Category already exists', HttpStatus.CONFLICT);
  }
}
