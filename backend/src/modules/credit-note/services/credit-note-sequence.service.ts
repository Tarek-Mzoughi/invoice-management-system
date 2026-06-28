import { Injectable } from '@nestjs/common';
import { EventsGateway } from 'src/shared/gateways/events/events.gateway';
import { UpdateCreditNoteSequenceDto } from '../dtos/credit-note-seqence.update.dto';
import { CreditNoteSequentialNotFoundException } from '../errors/credit-note-sequential.error';
import { formSequential } from 'src/modules/sequence/utils/sequence.utils';
import { WSRoom } from 'src/app/enums/ws-room.enum';
import { SequenceService } from 'src/modules/sequence/services/sequence.service';
import { Sequences } from 'src/app/enums/sequences.enum';
import { SequenceEntity } from 'src/modules/sequence/entities/sequence.entity';
import { ACTIVITY_TYPE } from 'src/app/enums/activity-types.enum';

@Injectable()
export class CreditNoteSequenceService {
  constructor(
    private readonly sequenceService: SequenceService,
    private readonly wsGateway: EventsGateway,
  ) {}

  private getSequenceLabel(activityType: ACTIVITY_TYPE): Sequences {
    return activityType === ACTIVITY_TYPE.BUYING
      ? Sequences.BUYING_CREDIT_NOTE
      : Sequences.CREDIT_NOTE;
  }

  async get(
    activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING,
  ): Promise<SequenceEntity> {
    const sequence = await this.sequenceService.ensureByLabel(
      this.getSequenceLabel(activityType),
    );
    if (!sequence) {
      throw new CreditNoteSequentialNotFoundException();
    }
    return sequence;
  }

  async set(
    updateCreditNoteSequenceDto: UpdateCreditNoteSequenceDto,
    activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING,
  ): Promise<SequenceEntity> {
    const sequence = await this.get(activityType);
    const updatedSequence = await this.sequenceService.update(
      sequence.id,
      updateCreditNoteSequenceDto,
    );
    return updatedSequence;
  }

  async getSequential(
    activityType: ACTIVITY_TYPE = ACTIVITY_TYPE.SELLING,
  ): Promise<string> {
    const sequence = await this.get(activityType);
    this.set(
      {
        ...sequence,
        next: sequence.next + 1,
      },
      activityType,
    );
    if (activityType === ACTIVITY_TYPE.SELLING) {
      this.wsGateway.sendToRoom(
        WSRoom.CREDIT_NOTE_SEQUENCE,
        'credit-note-sequence-updated',
        { value: sequence.next + 1 },
      );
    }
    return formSequential(sequence.prefix, sequence.dateFormat, sequence.next);
  }
}
