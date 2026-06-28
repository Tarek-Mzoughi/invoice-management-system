import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { ProfileService } from 'src/modules/user-management/services/profile.service';
import { UserService } from 'src/modules/user-management/services/user.service';
import { adminSeed } from './data/admin.data';
import { RoleService } from 'src/modules/user-management/services/role.service';

@Injectable()
export class AdminSeederCommand {
  constructor(
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
    private readonly roleService: RoleService,
  ) {}

  @Command({
    command: 'seed:admin',
    describe: 'seed system admin',
  })
  async seed() {
    const start = new Date();
    console.log('Starting seeding of admin');

    const role = await this.roleService.findOneByLabel('admin');

    let admin = await this.userService.findOneByUsername(
      adminSeed.core.username,
    );

    if (!admin) {
      const profile = await this.profileService.save(adminSeed.profile);
      admin = await this.userService.save({
        ...adminSeed.core,
        roleId: role.id,
        profileId: profile.id,
      });
    }

    const end = new Date();
    console.log(`Seeding completed in ${end.getTime() - start.getTime()}ms`);
  }
}
