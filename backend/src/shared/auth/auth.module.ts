import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { UserManagementModule } from 'src/modules/user-management/user-management.module';
import { AuthGuard } from './guards/auth.guard';
import { AuthService } from './services/auth.service';
import { AuthEmailService } from './services/auth-email.service';
import { StoreModule } from '../store/store.module';
import { MailModule } from '../mail/mail.module';
import { CabinetModule } from 'src/modules/cabinet/cabinet.module';
import { PermissionsGuard } from './guards/permissions.guard';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    UserManagementModule,
    CabinetModule,
    ConfigModule,
    StoreModule,
    MailModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 120,
      },
    ]),
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    AuthService,
    AuthEmailService,
  ],
  exports: [AuthService, AuthEmailService],
})
export class AuthModule {}
