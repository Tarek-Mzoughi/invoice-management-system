import { Injectable } from '@nestjs/common';
import { ActivityEntity } from '../entities/activity.entity';
import { ActivityRepository } from '../repositories/activity.repository';
import { AbstractCrudService } from 'src/shared/database/services/abstract-crud.service';

@Injectable()
export class ActivityService extends AbstractCrudService<ActivityEntity> {
  constructor(private readonly activityRepository: ActivityRepository) {
    super(activityRepository);
  }

  async findOneByLabel(label: string): Promise<ActivityEntity | null> {
    const activity = await this.activityRepository.findOne({
      where: { label },
    });
    if (!activity) {
      return null;
    }
    return activity;
  }
}
