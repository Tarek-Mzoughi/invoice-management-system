import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';

import { ActivityService } from 'src/modules/activity/services/activity.service';
import { activitiesSeed } from './data/activities.data';

@Injectable()
export class ActivitiesSeederCommand {
  constructor(private readonly activityService: ActivityService) {}

  @Command({
    command: 'seed:activities',
    describe: 'seed system activities',
  })
  async seed() {
    const start = new Date();
    console.log('Starting seeding of activities');

    await this.activityService.saveMany(
      activitiesSeed.map((label) => ({ label })),
    );

    const end = new Date();
    console.log(`Seeding completed in ${end.getTime() - start.getTime()}ms`);
  }
}
