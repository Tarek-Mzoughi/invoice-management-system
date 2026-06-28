import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class SendDocumentEmailDto {
  @ApiProperty({ example: 'client@example.com', type: String })
  @IsEmail()
  to: string;

  @ApiProperty({
    example: 'contact@example.com',
    type: String,
    required: false,
  })
  @IsEmail()
  @IsOptional()
  cc?: string;

  @ApiProperty({ example: 'Votre document', type: String })
  @IsString()
  subject: string;

  @ApiProperty({
    example: 'Veuillez trouver votre document en piece jointe.',
    type: String,
  })
  @IsString()
  message: string;

  @ApiProperty({ example: 'template1', type: String, required: false })
  @IsString()
  @IsOptional()
  template?: string;
}
