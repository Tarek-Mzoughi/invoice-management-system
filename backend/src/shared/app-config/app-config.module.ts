import { Module } from '@nestjs/common';
import { AppConfigService } from './services/app-config.service';
import { AppConfigEntity } from './entities/app-config.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigRepository } from './repositories/app-config.repository';

@Module({
  controllers: [],
  providers: [AppConfigService, AppConfigRepository],
  exports: [AppConfigService, AppConfigRepository],
  imports: [TypeOrmModule.forFeature([AppConfigEntity])],
})
export class AppConfigModule {}
