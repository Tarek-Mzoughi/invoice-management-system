import { Module } from '@nestjs/common';
import { FirmInterlocutorEntryService } from './services/firm-interlocutor-entry.service';
import { FirmInterlocutorEntryRepository } from './repositories/firm-interlocutor-entry.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FirmInterlocutorEntryEntity } from './entities/firm-interlocutor-entry.entity';

@Module({
  controllers: [],
  providers: [FirmInterlocutorEntryRepository, FirmInterlocutorEntryService],
  exports: [FirmInterlocutorEntryRepository, FirmInterlocutorEntryService],
  imports: [TypeOrmModule.forFeature([FirmInterlocutorEntryEntity])],
})
export class FirmInterlocutorEntryModule {}
