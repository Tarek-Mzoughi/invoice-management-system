import { Injectable } from '@nestjs/common';
import { TenantContextService } from 'src/shared/tenant/tenant-context.service';
import { UserService } from 'src/modules/user-management/services/user.service';

export interface AiUserContext {
  userId: string;
  email: string;
  userName: string;
  cabinetId: number;
  cabinetName: string;
}

@Injectable()
export class AiContextService {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly userService: UserService,
  ) {}

  async resolveUserContext(userSub: string): Promise<AiUserContext> {
    const user = await this.userService.findOneById(userSub);

    const cabinetId =
      await this.tenantContextService.getCurrentCabinetIdOrFail(userSub);

    const cabinet = (user as any).currentCabinet;

    return {
      userId: user.id,
      email: user.email ?? '',
      userName: user.username ?? user.email ?? 'Utilisateur',
      cabinetId,
      cabinetName: cabinet?.enterpriseName ?? 'Cabinet',
    };
  }
}
