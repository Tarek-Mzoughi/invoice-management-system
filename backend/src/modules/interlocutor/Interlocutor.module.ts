import { Module } from '@nestjs/common';
import { InterlocutorService } from './services/interlocutor.service';
import { FirmInterlocutorEntryModule } from '../firm-interlocutor-entry/firm-interlocutor-entry.module';
import { InterlocutorRepository } from './repositories/interlocutor.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InterlocutorEntity } from './entities/interlocutor.entity';

@Module({
  controllers: [],
  providers: [InterlocutorRepository, InterlocutorService],
  exports: [InterlocutorRepository, InterlocutorService],

  imports: [
    TypeOrmModule.forFeature([InterlocutorEntity]),
    FirmInterlocutorEntryModule,
  ],
})
export class InterlocutorModule {}
