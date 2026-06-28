import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerOrderUploadDto {
  @ApiProperty({
    example: 1,
    type: Number,
  })
  uploadId?: number;
}
