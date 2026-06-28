import { Module } from '@nestjs/common';
import { TaxService } from './services/tax.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxEntity } from './entities/tax.entity';
import { TaxRepository } from './repositories/tax.repository';
import { CabinetTaxConfigurationEntity } from './entities/cabinet-tax-configuration.entity';
import { CabinetTaxConfigurationRepository } from './repositories/cabinet-tax-configuration.repository';
import { TenantContextModule } from 'src/shared/tenant/tenant-context.module';

@Module({
  controllers: [],
  providers: [TaxRepository, CabinetTaxConfigurationRepository, TaxService],
  exports: [TaxRepository, CabinetTaxConfigurationRepository, TaxService],
  imports: [
    TenantContextModule,
    TypeOrmModule.forFeature([TaxEntity, CabinetTaxConfigurationEntity]),
  ],
})
export class TaxModule {}
