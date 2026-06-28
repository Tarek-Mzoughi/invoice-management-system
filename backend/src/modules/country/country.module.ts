import { Module } from '@nestjs/common';
import { CountryService } from './services/country.service';
import { CountryRepository } from './repositories/country.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CountryEntity } from './entities/country.entity';

@Module({
  controllers: [],
  providers: [CountryRepository, CountryService],
  exports: [CountryRepository, CountryService],
  imports: [TypeOrmModule.forFeature([CountryEntity])],
})
export class CountryModule {}
