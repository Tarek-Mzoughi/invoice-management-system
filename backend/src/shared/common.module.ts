import { Module } from '@nestjs/common';
import { GatewaysModule } from './gateways/gateways.module';

@Module({
  controllers: [],
  providers: [],
  imports: [GatewaysModule],
  exports: [GatewaysModule],
})
export class CommonModule {}
