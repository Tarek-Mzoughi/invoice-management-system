import { Module } from '@nestjs/common';
import { TaxWithholdingService } from './services/tax-withholding.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxWithholdingEntity } from './entities/tax-withholding.entity';
import { TaxWithholdingRepository } from './repositories/tax-withholding.repository';

@Module({
  controllers: [],
  providers: [TaxWithholdingRepository, TaxWithholdingService],
  exports: [TaxWithholdingRepository, TaxWithholdingService],
  imports: [TypeOrmModule.forFeature([TaxWithholdingEntity])],
})
export class TaxWithholdingModule {}
