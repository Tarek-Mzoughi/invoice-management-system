import { Module } from '@nestjs/common';
import { ArticleService } from './services/article.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleEntity } from './entities/article.entity';
import { ArticleRepository } from './repositories/article.repository';
import { StorageModule } from 'src/shared/storage/storage.module';
import { TenantContextModule } from 'src/shared/tenant/tenant-context.module';
import { PriceListEntity } from 'src/modules/price-list/entities/price-list.entity';
import { TaxModule } from 'src/modules/tax/tax.module';

@Module({
  controllers: [],
  providers: [ArticleRepository, ArticleService],
  exports: [ArticleRepository, ArticleService],
  imports: [
    TypeOrmModule.forFeature([ArticleEntity, PriceListEntity]),
    StorageModule,
    TaxModule,
    TenantContextModule,
  ],
})
export class ArticleModule {}
