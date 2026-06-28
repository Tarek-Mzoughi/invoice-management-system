import { PartialType } from '@nestjs/swagger';
import { CreateCabinetDto } from './cabinet.create.dto';

export class UpdateCabinetDto extends PartialType(CreateCabinetDto) {}
