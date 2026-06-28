import { HttpException, HttpStatus } from '@nestjs/common';

export class TemplateCategoryNotFoundException extends HttpException {
  constructor() {
    super('template category not found', HttpStatus.NOT_FOUND);
  }
}
