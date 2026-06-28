import { Module } from '@nestjs/common';
import { UserManagementModule } from 'src/modules/user-management/user-management.module';
import { TenantContextService } from './tenant-context.service';

@Module({
  imports: [UserManagementModule],
  providers: [TenantContextService],
  exports: [TenantContextService],
})
export class TenantContextModule {}
