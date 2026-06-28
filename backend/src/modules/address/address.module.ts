import { Module } from '@nestjs/common';
import { AddressService } from './services/address.service';
import { CountryModule } from '../country/country.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressEntity } from './entities/address.entity';
import { AddressRepository } from './repositories/address.repository';

@Module({
  controllers: [],
  providers: [AddressRepository, AddressService],
  exports: [AddressRepository, AddressService],
  imports: [TypeOrmModule.forFeature([AddressEntity]), CountryModule],
})
export class AddressModule {}
