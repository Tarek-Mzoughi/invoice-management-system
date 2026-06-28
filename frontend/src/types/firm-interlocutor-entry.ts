import { Firm } from './firm';
import { Interlocutor } from './interlocutor';
import { DatabaseEntity } from './response/DatabaseEntity';

export interface FirmInterlocutorEntry extends DatabaseEntity {
  id?: number;
  firmId?: number;
  firm?: Firm;
  interlocutor?: Interlocutor;
  interlocutorId?: number;
  isMain?: boolean;
  position?: string;
}

export interface CreateFirmInterlocutorEntryDto
  extends Omit<
    FirmInterlocutorEntry,
    'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'isDeletionRestricted' | 'interlocutor'
  > {}
export interface UpdateFirmInterlocutorEntryDto extends CreateFirmInterlocutorEntryDto {
  id: number;
}
