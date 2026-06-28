import { ApiProperty } from '@nestjs/swagger';
import { ResponseDtoHelper } from 'src/shared/database/dtos/database.response.dto';

export class ResponsePriceListDto extends ResponseDtoHelper {
  @ApiProperty({ example: 1, type: Number })
  id: number;

  @ApiProperty({ example: 'Prix de gros', type: String })
  name: string;

  @ApiProperty({ example: true, type: Boolean })
  active: boolean;

  @ApiProperty({ example: 1, type: Number, required: false })
  cabinetId?: number;
}
