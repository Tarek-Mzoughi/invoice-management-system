import { ApiProperty } from '@nestjs/swagger';

export class ResponseTemplateCategoryDto {
  @ApiProperty({ example: 'DEVIS', type: String })
  label: string;
}
