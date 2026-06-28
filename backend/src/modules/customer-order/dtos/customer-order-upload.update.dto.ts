import { ApiProperty } from '@nestjs/swagger';
import { CreateCustomerOrderUploadDto } from './customer-order-upload.create.dto';

export class UpdateCustomerOrderUploadDto extends CreateCustomerOrderUploadDto {
  @ApiProperty({ example: 1, type: Number })
  id: number;
}
