import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { RoleService } from 'src/modules/user-management/services/role.service';
import { PermissionService } from 'src/modules/user-management/services/permission.service';
import { OFFICIAL_PERMISSION_IDS } from 'src/modules/user-management/rbac/permission.constants';

@Injectable()
export class RolesSeederCommand {
  constructor(
    private readonly roleService: RoleService,
    private readonly permissionService: PermissionService,
  ) {}

  @Command({
    command: 'seed:roles',
    describe: 'seed system roles',
  })
  async seed() {
    const start = new Date();
    console.log('Starting seeding of roles');

    const permissions = await this.permissionService.findAll();
    const officialPermissions = permissions.filter((p) =>
      OFFICIAL_PERMISSION_IDS.has(p.id),
    );
    const collaboratorReadEntities = [
      'dashboard',
      'enterprise',
      'selling_documents',
      'buying_documents',
      'payments',
      'suppliers',
      'clients',
      'products',
      'treasury',
      'price_lists',
      'taxes',
      'document_settings',
    ];
    const collaboratorWriteEntities = [
      'selling_documents',
      'buying_documents',
      'payments',
      'suppliers',
      'clients',
      'products',
      'price_lists',
    ];
    const collaboratorPermissionIds = new Set<string>();

    officialPermissions.forEach((permission) => {
      const [action, ...entityParts] = permission.id.split('-');
      const entity = entityParts.join('-');

      if (action === 'read' && collaboratorReadEntities.includes(entity)) {
        collaboratorPermissionIds.add(permission.id);
      }

      if (
        (action === 'create' || action === 'update') &&
        collaboratorWriteEntities.includes(entity)
      ) {
        collaboratorPermissionIds.add(permission.id);
      }
    });

    for (const roleDto of [
      {
        label: 'admin',
        description: 'This role is for admin users',
        permissions: officialPermissions.map((p) => ({
          permissionId: p.id,
        })),
      },
      {
        label: 'standard-user',
        description: 'This role is for standard users',
        permissions: Array.from(collaboratorPermissionIds).map(
          (permissionId) => ({
            permissionId,
          }),
        ),
      },
    ]) {
      try {
        await this.roleService.saveWithPermissions(roleDto);
      } catch (error) {
        // Ignore if role already exists to make seeder idempotent
      }
    }

    const end = new Date();
    console.log(`Seeding completed in ${end.getTime() - start.getTime()}ms`);
  }
}
