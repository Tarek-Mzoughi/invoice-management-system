import { ApiProperty } from '@nestjs/swagger';
import { ResponseDtoHelper } from 'src/shared/database/dtos/database.response.dto';

export class ResponseCountryDto extends ResponseDtoHelper {
  @ApiProperty({ example: 1, type: Number })
  id: number;

  @ApiProperty({ example: 'TN', type: String })
  alpha2Code: string;

  @ApiProperty({ example: 'TUN', type: String })
  alpha3Code: string;
}
