import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsObject } from 'class-validator';

export class AiConfirmActionBodyDto {
  @ApiProperty({
    description:
      'Optional overrides to merge into the action payload before execution',
    required: false,
    example: {
      items: [{ title: 'Modified item', quantity: 2, unitPrice: 100 }],
    },
  })
  @IsOptional()
  @IsObject()
  overrides?: Record<string, unknown>;
}

export class AiConfirmActionResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({
    description: 'Outcome status for idempotent handling',
    enum: ['executed', 'already_executed', 'confirming', 'failed', 'cancelled'],
    required: false,
  })
  status?: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  entity?: Record<string, unknown>;
}
