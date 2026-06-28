import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';
import { ResponseInterlocutorDto } from 'src/modules/interlocutor/dtos/interlocutor.response.dto';

export class ResponseFirmInterlocutorEntryDto {
  @ApiProperty({ example: 1, type: Number })
  @IsInt()
  id?: number;

  @ApiProperty({ example: 1, type: Number })
  @IsInt()
  firmId?: number;

  @ApiProperty({ example: 1, type: Number })
  @IsInt()
  interlocutorId?: number;

  @ApiProperty({ type: () => ResponseInterlocutorDto, nullable: true })
  interlocutor?: ResponseInterlocutorDto;

  @ApiProperty({ example: false, type: Boolean, required: false })
  @IsInt()
  isMain?: boolean;

  @ApiProperty({ example: 'CEO', type: String, required: false })
  @IsString()
  position?: string;
}
