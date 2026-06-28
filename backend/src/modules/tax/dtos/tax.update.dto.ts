import { PartialType } from '@nestjs/swagger';
import { CreateTaxDto } from './tax.create.dto';

export class UpdateTaxDto extends PartialType(CreateTaxDto) {}
