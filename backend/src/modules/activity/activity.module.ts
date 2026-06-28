import { Module } from '@nestjs/common';
import { ActivityService } from './services/activity.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityEntity } from './entities/activity.entity';
import { ActivityRepository } from './repositories/activity.repository';

@Module({
  controllers: [],
  providers: [ActivityRepository, ActivityService],
  exports: [ActivityRepository, ActivityService],
  imports: [TypeOrmModule.forFeature([ActivityEntity])],
})
export class ActivityModule {}
