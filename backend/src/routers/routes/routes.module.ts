import { Module } from '@nestjs/common';
import { AuthModule } from 'src/shared/auth/auth.module';
import { AuthController } from 'src/shared/auth/controllers/auth.controller';
import { LoggerModule } from 'src/shared/logger/logger.module';

@Module({
  controllers: [AuthController],
  imports: [AuthModule, LoggerModule],
})
export class RoutesModule {}
