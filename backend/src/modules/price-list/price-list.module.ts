import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleEntity } from 'src/modules/article/entities/article.entity';
import { TenantContextModule } from 'src/shared/tenant/tenant-context.module';
import { PriceListEntity } from './entities/price-list.entity';
import { PriceListRepository } from './repositories/price-list.repository';
import { PriceListService } from './services/price-list.service';

@Module({
  controllers: [],
  providers: [PriceListRepository, PriceListService],
  exports: [PriceListRepository, PriceListService],
  imports: [
    TypeOrmModule.forFeature([PriceListEntity, ArticleEntity]),
    TenantContextModule,
  ],
})
export class PriceListModule {}
