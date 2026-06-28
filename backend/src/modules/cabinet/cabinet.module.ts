import { Module } from '@nestjs/common';
import { CabinetService } from './services/cabinet.service';
import { AddressModule } from '../address/address.module';
import { CurrencyModule } from '../currency/currency.module';
import { ActivityModule } from '../activity/activity.module';
import { CabinetRepository } from './repositories/cabinet.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CabinetEntity } from './entities/cabinet.entity';
import { StorageModule } from 'src/shared/storage/storage.module';
import { CountryModule } from '../country/country.module';

@Module({
  controllers: [],
  providers: [CabinetRepository, CabinetService],
  exports: [CabinetRepository, CabinetService],
  imports: [
    TypeOrmModule.forFeature([CabinetEntity]),
    ActivityModule,
    AddressModule,
    CurrencyModule,
    CountryModule,
    StorageModule,
  ],
})
export class CabinetModule {}
