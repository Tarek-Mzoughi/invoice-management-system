import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserService } from 'src/modules/user-management/services/user.service';
import {
  getEffectivePermissionIds,
  isAdminRole,
  isAdminRoleType,
  resolveCabinetMembership,
} from 'src/modules/user-management/rbac/rbac.utils';
import { IS_PUBLIC_KEY } from '../utils/public-strategy';
import {
  REQUIRED_PERMISSIONS_KEY,
  RequiredPermissionMetadata,
} from '../decorators/require-permissions.decorator';

const ACTION_FORBIDDEN_MESSAGES: Record<string, string> = {
  read: "Vous n'avez pas l'autorisation de consulter cette ressource.",
  create: "Vous n'avez pas l'autorisation de créer cette ressource.",
  update: "Vous n'avez pas l'autorisation de modifier cette ressource.",
  delete: "Vous n'avez pas l'autorisation de supprimer cette ressource.",
};

const getPermissionAction = (permissionId?: string) =>
  permissionId?.split('-')[0];

const isReadPermission = (permissionId: string) =>
  getPermissionAction(permissionId) === 'read';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const metadata =
      this.reflector.getAllAndOverride<RequiredPermissionMetadata>(
        REQUIRED_PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );
    if (!metadata?.permissions?.length && metadata?.mode !== 'admin') {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;
    if (!userId) {
      throw new ForbiddenException('Utilisateur authentifié requis.');
    }

    const user = await this.userService.findOneById(userId);
    const cabinetId = this.resolveCabinetId(request);
    const membership = resolveCabinetMembership(user, cabinetId);
    if (cabinetId && !membership) {
      throw new ForbiddenException('Cabinet access denied');
    }
    const hasAdminMembership = (user.cabinetMemberships || []).some(
      (userMembership) =>
        userMembership.isActive !== false &&
        isAdminRoleType(userMembership.roleType),
    );
    const isAdmin =
      isAdminRoleType(membership?.roleType) ||
      hasAdminMembership ||
      (!membership && isAdminRole(user.role));
    request.isAdmin = isAdmin;

    if (metadata.mode === 'admin') {
      if (!isAdmin) {
        throw new ForbiddenException(
          metadata.message ||
            "Vous n'avez pas l'autorisation d'accéder aux outils administratifs.",
        );
      }
      return true;
    }

    const effectivePermissionIds = getEffectivePermissionIds(user, cabinetId);
    request.effectivePermissionIds = effectivePermissionIds;
    if (isAdmin) {
      return true;
    }

    if (
      metadata.mode === 'any' &&
      metadata.permissions.some(isReadPermission)
    ) {
      return true;
    }

    const actionablePermissions = metadata.permissions.filter(
      (permissionId) => !isReadPermission(permissionId),
    );
    if (actionablePermissions.length === 0) {
      return true;
    }

    const permissionChecker = (permissionId: string) =>
      effectivePermissionIds.includes(permissionId);
    const isAllowed =
      metadata.mode === 'any'
        ? actionablePermissions.some(permissionChecker)
        : actionablePermissions.every(permissionChecker);

    if (!isAllowed) {
      throw new ForbiddenException(
        metadata.message || this.getForbiddenMessage(actionablePermissions[0]),
      );
    }

    return true;
  }

  private getForbiddenMessage(permissionId?: string): string {
    const action = permissionId?.split('-')[0];
    return (
      (action && ACTION_FORBIDDEN_MESSAGES[action]) ||
      "Vous n'avez pas l'autorisation d'effectuer cette action."
    );
  }

  private resolveCabinetId(request: { headers?: Record<string, unknown> }) {
    const rawCabinetId =
      request.headers?.['x-cabinet-id'] ||
      request.headers?.['X-Cabinet-Id'] ||
      request.headers?.['x-cabinetid'];
    const cabinetId = Number(
      Array.isArray(rawCabinetId) ? rawCabinetId[0] : rawCabinetId,
    );
    return Number.isInteger(cabinetId) && cabinetId > 0 ? cabinetId : undefined;
  }
}
