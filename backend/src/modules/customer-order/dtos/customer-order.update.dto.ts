import { ApiProperty } from '@nestjs/swagger';
import { UpdateCustomerOrderUploadDto } from './customer-order-upload.update.dto';
import { IsOptional } from 'class-validator';
import { CreateCustomerOrderDto } from './customer-order.create.dto';

export class UpdateCustomerOrderDto extends CreateCustomerOrderDto {
  @ApiProperty({ example: 1, type: Number })
  id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  uploads?: UpdateCustomerOrderUploadDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  createInvoice: boolean;
}
