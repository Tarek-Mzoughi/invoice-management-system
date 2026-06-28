import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import { TREASURY_MOVEMENT_DIRECTION } from '../enums/treasury-movement-direction.enum';
import { TREASURY_MOVEMENT_KIND } from '../enums/treasury-movement-kind.enum';

export class ResponseTreasuryMovementDto {
  @ApiProperty({ example: faker.number.int(), required: false })
  id?: number;

  @ApiProperty({ example: faker.number.int(), required: false })
  accountId?: number;

  @ApiProperty({ example: faker.number.int(), required: false })
  currencyId?: number;

  @ApiProperty({ enum: TREASURY_MOVEMENT_KIND, required: false })
  kind?: TREASURY_MOVEMENT_KIND;

  @ApiProperty({ enum: TREASURY_MOVEMENT_DIRECTION, required: false })
  direction?: TREASURY_MOVEMENT_DIRECTION;

  @ApiProperty({ example: faker.number.float(), required: false })
  amount?: number;

  @ApiProperty({
    example: faker.finance.transactionDescription(),
    required: false,
  })
  label?: string;

  @ApiProperty({ example: faker.lorem.sentence(), required: false })
  notes?: string;

  @ApiProperty({ example: faker.date.recent().toISOString(), required: false })
  movementDate?: Date;
}
