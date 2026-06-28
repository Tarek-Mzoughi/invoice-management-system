import { Module } from '@nestjs/common';
import { CurrencyService } from './services/currency.service';
import { CurrencyRepository } from './repositories/currency.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrencyEntity } from './entities/currency.entity';

@Module({
  controllers: [],
  providers: [CurrencyRepository, CurrencyService],
  exports: [CurrencyRepository, CurrencyService],
  imports: [TypeOrmModule.forFeature([CurrencyEntity])],
})
export class CurrencyModule {}
