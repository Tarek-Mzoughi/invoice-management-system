import { Global, Module } from '@nestjs/common';
import { EventsGateway } from './events/events.gateway';
import { UserManagementModule } from 'src/modules/user-management/user-management.module';

@Global()
@Module({
  providers: [EventsGateway],
  exports: [EventsGateway],
  imports: [UserManagementModule],
})
export class GatewaysModule {}
