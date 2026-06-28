import { ApiProperty } from '@nestjs/swagger';
import { faker } from '@faker-js/faker';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Gender } from 'src/modules/user-management/enums/gender.enum';

const trimRequiredString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const optionalTrimmedString = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

export class RequestRegisterDto {
  @ApiProperty({
    type: String,
    example: faker.person.firstName(),
    required: false,
  })
  @Transform(optionalTrimmedString)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiProperty({
    type: String,
    example: faker.person.lastName(),
    required: false,
  })
  @Transform(optionalTrimmedString)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiProperty({
    type: String,
    example: faker.internet.email(),
  })
  @Transform(trimRequiredString)
  @IsEmail()
  email: string;

  @ApiProperty({
    type: String,
    example: faker.internet.email(),
    required: false,
  })
  @Transform(optionalTrimmedString)
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @ApiProperty({
    type: String,
    example: faker.phone.number(),
    required: false,
  })
  @Transform(optionalTrimmedString)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiProperty({
    type: Date,
    required: false,
  })
  @Transform(optionalTrimmedString)
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({
    type: String,
    example: '12345678',
    required: false,
  })
  @Transform(optionalTrimmedString)
  @IsOptional()
  @IsString()
  @Length(8, 8)
  cin?: string;

  @ApiProperty({
    type: String,
    required: false,
  })
  @Transform(optionalTrimmedString)
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    enum: Gender,
    required: false,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({
    type: Boolean,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiProperty({
    type: Number,
    required: false,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  profilePictureId?: number;

  @ApiProperty({ type: String, example: 'Password123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
    message:
      'Password must include uppercase, lowercase, number, and special character',
  })
  password: string;
}
