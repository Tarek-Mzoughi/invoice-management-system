import { Module } from '@nestjs/common';
import { LoggerController } from 'src/shared/logger/controller/logger.controller';
import { LoggerModule } from 'src/shared/logger/logger.module';
import { StoreController } from 'src/shared/store/controllers/store.controller';
import { StoreModule } from 'src/shared/store/store.module';

@Module({
  controllers: [LoggerController, StoreController],
  providers: [],
  exports: [],
  imports: [LoggerModule, StoreModule],
})
export class RoutesAdminModule {}
