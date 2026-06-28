import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SequenceEntity } from './entities/sequence.entity';
import { SequenceRepository } from './repositories/sequence.repository';
import { SequenceService } from './services/sequence.service';
import { AppConfigModule } from 'src/shared/app-config/app-config.module';

@Module({
  providers: [SequenceRepository, SequenceService],
  exports: [SequenceRepository, SequenceService],
  imports: [TypeOrmModule.forFeature([SequenceEntity]), AppConfigModule],
})
export class SequenceModule {}
