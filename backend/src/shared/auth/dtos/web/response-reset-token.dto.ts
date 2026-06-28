import { ApiProperty } from '@nestjs/swagger';

export class ResponseResetTokenDto {
  @ApiProperty({
    type: String,
    example: 'If an account exists, a password reset link has been sent.',
  })
  message: string;

  @ApiProperty({ type: Boolean, example: true })
  success: boolean;
}
