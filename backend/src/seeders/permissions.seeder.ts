import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { PermissionService } from 'src/modules/user-management/services/permission.service';
import { ALL_PERMISSION_IDS } from 'src/modules/user-management/rbac/permission.constants';

@Injectable()
export class PermissionsSeederCommand {
  constructor(private readonly permissionService: PermissionService) {}

  @Command({
    command: 'seed:permissions',
    describe: 'seed system permissions',
  })
  async seed() {
    const start = new Date();
    console.log('Starting seeding of permissions');

    for (const permissionId of ALL_PERMISSION_IDS) {
      const [action, ...entityParts] = permissionId.split('-');
      const entity = entityParts.join('-');
      try {
        await this.permissionService.save({
          id: permissionId,
          label: `${action.toUpperCase()}_${entity.toUpperCase()}`,
          description: `This permission is for ${action} ${entity}`,
        });
      } catch (error) {
        // Ignore if permission already exists to make seeder idempotent
      }
    }

    const end = new Date();
    console.log(`Seeding completed in ${end.getTime() - start.getTime()}ms`);
  }
}
